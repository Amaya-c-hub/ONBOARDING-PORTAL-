import { Controller, Post, Body, Req, Res, UseGuards, HttpCode, Get, UnauthorizedException, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, ResendOtpDto, CreateCandidateDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from './entities/user.entity';

import { CaptchaService } from './services/captcha.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-event.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authSvc: AuthService,
    private captchaSvc: CaptchaService,
    private auditSvc: AuditService,
  ) {}

  @Get('altcha-challenge')
  @ApiOperation({ summary: 'Generate a CAPTCHA challenge' })
  @ApiResponse({ status: 200, description: 'Returns an Altcha challenge object' })
  async getAltchaChallenge() {
    return this.captchaSvc.generateChallenge();
  }


  // POST /auth/send-otp  — rate-limited
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: parseInt(process.env.OTP_RATE_LIMIT_MAX || '5', 10), ttl: parseInt(process.env.OTP_RATE_LIMIT_TTL_SEC || '900', 10) } })
  @Post('send-otp')
  @ApiOperation({ summary: 'Send an OTP to the user email' })
  @ApiResponse({ status: 201, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or role mismatch' })
  sendOtp(@Body() dto: SendOtpDto, @Req() req: Request) {
    const ip = req.ip ?? req.socket.remoteAddress;
    return this.authSvc.sendOtp(dto.email, dto.captchaToken, ip, dto.selectedRole, dto.password);
  }

  // POST /auth/resend-otp — rate-limited
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 900 } }) // Stricter limit for resends
  @Post('resend-otp')
  resendOtp(@Body() dto: ResendOtpDto, @Req() req: Request) {
    const ip = req.ip ?? req.socket.remoteAddress;
    return this.authSvc.resendOtp(dto.resendToken, ip);
  }

  // POST /auth/verify-otp  — returns tokens, sets httpOnly refresh cookie
  @Post('verify-otp')
  @HttpCode(200)
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authSvc.verifyOtp(dto.email, dto.code, req.ip);
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure:   true,
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: result.accessToken, role: result.role };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    const result = await this.authSvc.refreshTokens(refreshToken);
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure:   true,
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: result.accessToken, role: result.role };
  }

  // POST /auth/logout — clears refresh cookie
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const user = req.user;
    
    // Record the logout event
    await this.auditSvc.log({
      action: AuditAction.LOGOUT,
      userId: user.sub,
      email: user.email,
      ip: req.ip,
    });

    res.clearCookie('refresh_token');
    return { message: 'Logged out' };
  }

  // --- CANDIDATE MANAGEMENT (For Intern 4 Integration) ---

  @Post('candidates')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new candidate (HR/Manager only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HR, Role.MANAGER)
  async addCandidate(@Body() dto: CreateCandidateDto, @Req() req: any) {
    return this.authSvc.createCandidate(dto, req.user.email);
  }

  @Patch('candidates/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HR, Role.MANAGER)
  async updateCandidateStatus(@Body() body: { email: string, status: string }, @Req() req: any) {
    return this.authSvc.updateCandidateStatus(body.email, body.status, req.user.email);
  }

  @Get('candidates/:email/audit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HR, Role.MANAGER)
  async getCandidateAudit(@Param('email') email: string) {
    return this.auditSvc.getEventsByEmail(email);
  }

  // --- ROLE TESTING ENDPOINTS ---

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: Request) {
    return req.user;
  }

  @Get('hr-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HR)
  hrOnly() {
    return { message: 'Welcome HR' };
  }

  @Get('manager-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  managerOnly() {
    return { message: 'Welcome Manager' };
  }
}
