import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, Role } from './entities/user.entity';
import { Otp } from './entities/otp.entity';
import { Candidate } from './entities/candidate.entity';
import { EmailService } from './services/email.service';
import { CaptchaService } from './services/captcha.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-event.entity';
import { CreateCandidateDto } from './dto/auth.dto';
import * as crypto from 'crypto';

// Configuration values will be loaded from ConfigService

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Otp) private otps: Repository<Otp>,
    @InjectRepository(Candidate) private candidates: Repository<Candidate>,
    private jwtService: JwtService,
    private configSvc: ConfigService,
    private emailSvc: EmailService,
    private captchaSvc: CaptchaService,
    private auditSvc: AuditService,
  ) { }

  async sendOtp(email: string, captchaToken: string, ip: string, selectedRole?: string, password?: string) {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Only require Captcha for candidates
    if (selectedRole === 'candidate') {
      // --- TESTING BYPASS ---
      // Allow 'bypass-captcha' to skip verification in dev mode for easier Swagger testing
      if (this.configSvc.get('NODE_ENV') === 'development' && captchaToken === 'bypass-captcha') {
        this.logger.warn(`[Security] Captcha bypass used for email: ${normalizedEmail}`);
      } else {
        try {
          await this.captchaSvc.verify(captchaToken);
        } catch (e) {
          await this.auditSvc.log({ action: AuditAction.CAPTCHA_FAILED, email: normalizedEmail, ip });
          throw e;
        }
      }
    }

    // RBAC: Only pre-registered users can log in
    let user = await this.users.createQueryBuilder('user')
      .where('user.email = :email AND user.isActive = :isActive', { email: normalizedEmail, isActive: true })
      .addSelect('user.password')
      .getOne();

    // --- AUTO-SYNC: If not in 'users' but in 'Candidate' (Intern 4), create user now ---
    if (!user) {
      const candidate = await this.candidates.findOneBy({ email: normalizedEmail });
      if (candidate) {
        this.logger.log(`[Sync] Auto-creating user for Intern 4 candidate: ${normalizedEmail}`);
        user = await this.users.save(this.users.create({
          email: normalizedEmail,
          role: Role.CANDIDATE,
          isActive: true
        }));
        
        // Link the candidate to our user
        await this.candidates.update(candidate.id, { userId: user.id });
      }
    }

    this.logger.log(`[Login Attempt] Email: ${normalizedEmail}, Selected Role: ${selectedRole}, Found: ${!!user}, Password Provided: ${!!password}`);

    if (!user) {
      await this.auditSvc.log({ 
        action: AuditAction.LOGIN_FAILED, 
        email: normalizedEmail, 
        ip, 
        meta: { reason: 'unregistered_email_attempt', selectedRole } 
      });
      throw new BadRequestException(
        'This email is not registered in our system. Please contact HR to receive an invitation.',
      );
    }

    // Role-mismatch: user selected a role on login page that doesn't match DB
    if (user && selectedRole && user.role !== selectedRole) {
      await this.auditSvc.log({ 
        action: AuditAction.LOGIN_FAILED, 
        email: normalizedEmail, 
        ip, 
        meta: { reason: 'role_mismatch', dbRole: user.role, selectedRole } 
      });
      const label = selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1);
      throw new ForbiddenException(
        `This email is not registered as a ${label} user. Please select the correct role.`,
      );
    }

    // --- NEW: Password Check for HR/Manager ---
    if (user.role === Role.HR || user.role === Role.MANAGER) {
      if (!password) {
        throw new BadRequestException('Password is required for this role.');
      }
      
      const passwordMatch = user.password ? await bcrypt.compare(password, user.password) : false;
      if (!passwordMatch) {
        await this.auditSvc.log({ 
          action: AuditAction.LOGIN_FAILED, 
          email: normalizedEmail, 
          ip, 
          meta: { reason: 'invalid_password' } 
        });
        throw new UnauthorizedException('Invalid email or password.');
      }
    }

    const plain = String(Math.floor(100000 + Math.random() * 900000));

    const hashed = await bcrypt.hash(plain, 10);

    const otpTtlMs = this.configSvc.get<number>('OTP_TTL_MS', 600000);

    await this.otps.save(this.otps.create({
      email: normalizedEmail,
      code: hashed,
      expiresAt: new Date(Date.now() + Number(otpTtlMs)),
    }));

    this.logger.log(
      `[OTP] ${normalizedEmail} (${user?.role || 'New Candidate'}): ${plain}`
    );

    await Promise.all([
      this.emailSvc.sendOtp(normalizedEmail, plain),
      this.auditSvc.log({ action: AuditAction.OTP_SENT, email: normalizedEmail, ip }),
    ]);

    const resendToken = this.jwtService.sign(
      { email: normalizedEmail, role: selectedRole || user?.role || 'candidate', action: 'resend_otp' },
      { expiresIn: '15m' }
    );

    return { message: 'OTP sent', resendToken };
  }

  async resendOtp(resendToken: string, ip: string) {
    try {
      const payload = await this.jwtService.verifyAsync(resendToken);
      if (payload.action !== 'resend_otp') throw new Error('Invalid token action');
      
      const email = payload.email;
      const plain = String(Math.floor(100000 + Math.random() * 900000));
      const hashed = await bcrypt.hash(plain, 10);
      const otpTtlMs = this.configSvc.get<number>('OTP_TTL_MS', 600000);

      await this.otps.save(this.otps.create({
        email,
        code: hashed,
        expiresAt: new Date(Date.now() + Number(otpTtlMs)),
      }));

      await Promise.all([
        this.emailSvc.sendOtp(email, plain),
        this.auditSvc.log({ action: AuditAction.OTP_SENT, email, ip, meta: { method: 'resend' } }),
      ]);

      return { message: 'OTP resent successfully' };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired resend token. Please start over.');
    }
  }

  async verifyOtp(email: string, code: string, ip: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const otp = await this.otps.findOne({
      where: { email: normalizedEmail, used: false, expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });

    const maxAttempts = this.configSvc.get<number>('MAX_ATTEMPTS', 3);

    if (!otp || otp.attempts >= Number(maxAttempts)) {
      await this.auditSvc.log({ action: AuditAction.LOGIN_FAILED, email: normalizedEmail, ip });
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    let valid = await bcrypt.compare(code, otp.code);
    
    // In development mode, allow '123456' as a testing bypass
    if (!valid && this.configSvc.get('NODE_ENV') === 'development' && code === '123456') {
      this.logger.warn(`[Security] OTP bypass '123456' used for email: ${normalizedEmail}`);
      valid = true;
    }

    if (!valid) {
      await this.otps.update(otp.id, { attempts: otp.attempts + 1 });
      await this.auditSvc.log({ action: AuditAction.LOGIN_FAILED, email: normalizedEmail, ip });
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.otps.update(otp.id, { used: true });

    let user = await this.users.findOneBy({ email: normalizedEmail });

    // If candidate doesn't exist, create them now.
    if (!user) {
      user = await this.users.save(this.users.create({
        email: normalizedEmail,
        role: Role.CANDIDATE,
        isActive: true,
      }));
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessExp = this.configSvc.get<string>('JWT_ACCESS_EXP', '24h');
    const refreshExp = this.configSvc.get<string>('JWT_REFRESH_EXP', '7d');

    const accessToken = this.jwtService.sign(payload, { expiresIn: accessExp as any });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: refreshExp as any });

    await this.auditSvc.log({ action: AuditAction.LOGIN_SUCCESS, email: normalizedEmail, userId: user.id, ip });

    return { accessToken, refreshToken, role: user.role };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken);
      const user = await this.users.findOneBy({ id: payload.sub, isActive: true });

      if (!user) throw new UnauthorizedException('User not found');

      const newPayload = { sub: user.id, email: user.email, role: user.role };
      const accessExp = this.configSvc.get<string>('JWT_ACCESS_EXP', '24h');
      const refreshExp = this.configSvc.get<string>('JWT_REFRESH_EXP', '7d');

      const newAccessToken = this.jwtService.sign(newPayload, { expiresIn: accessExp as any });
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: refreshExp as any });

      await this.auditSvc.log({ action: AuditAction.TOKEN_REFRESHED, email: user.email, userId: user.id });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken, role: user.role };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async createCandidate(dto: CreateCandidateDto, adminEmail: string) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    
    // Check if candidate already exists
    const existing = await this.candidates.findOneBy({ email: normalizedEmail });
    if (existing) {
      throw new BadRequestException('Candidate with this email already exists.');
    }

    const candidate = await this.candidates.save(this.candidates.create({
      id: crypto.randomUUID(),
      email: normalizedEmail,
      firstName: dto.firstName,
      lastName: dto.lastName,
      status: dto.status || 'Applied',
    }));

    await this.auditSvc.log({
      action: AuditAction.CANDIDATE_CREATED,
      email: normalizedEmail,
      meta: { createdBy: adminEmail }
    });

    return candidate;
  }

  async updateCandidateStatus(email: string, status: string, adminEmail: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const candidate = await this.candidates.findOneBy({ email: normalizedEmail });
    
    if (!candidate) {
      throw new BadRequestException('Candidate not found.');
    }

    await this.candidates.update(candidate.id, { status });

    // If status is 'Rejected' or 'Withdrawn', we might want to deactivate their user account
    if (['Rejected', 'Withdrawn'].includes(status)) {
      await this.users.update({ email: normalizedEmail }, { isActive: false });
      this.logger.log(`[Status Sync] Deactivated user ${normalizedEmail} due to status: ${status}`);
    } else if (status === 'Onboarded' || status === 'Applied') {
      // Re-activate if they were rejected but now back in pool? 
      // Usually Onboarded candidates still need access until they are employees.
      await this.users.update({ email: normalizedEmail }, { isActive: true });
    }

    await this.auditSvc.log({
      action: AuditAction.CANDIDATE_STATUS_UPDATED,
      email: normalizedEmail,
      meta: { newStatus: status, updatedBy: adminEmail }
    });

    return { message: 'Candidate status updated successfully', status };
  }
}
