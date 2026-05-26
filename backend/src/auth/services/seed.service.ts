import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, Role } from '../entities/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private configSvc: ConfigService,
  ) {}

  async onModuleInit() {
    this.logger.log('Synchronizing test users from .env...');
    await this.seedUsers();
  }

  private async seedUsers() {
    const candidateEmail = this.configSvc.get<string>('TEST_CANDIDATE_EMAIL');
    const hrEmail = this.configSvc.get<string>('TEST_HR_EMAIL');
    const hrPassword = this.configSvc.get<string>('TEST_HR_PASSWORD', 'Linnk@2026');
    const managerEmail = this.configSvc.get<string>('TEST_MANAGER_EMAIL');
    const managerPassword = this.configSvc.get<string>('TEST_MANAGER_PASSWORD', 'Linnk@2026');

    // 1. Sync Candidate
    if (candidateEmail) {
      await this.upsertUser(candidateEmail, Role.CANDIDATE);
    }

    // 2. Sync HR (with password)
    if (hrEmail) {
      const hashedHr = await bcrypt.hash(hrPassword, 10);
      await this.upsertUser(hrEmail, Role.HR, hashedHr);
    }

    // 3. Sync Manager (with password)
    if (managerEmail) {
      const hashedManager = await bcrypt.hash(managerPassword, 10);
      await this.upsertUser(managerEmail, Role.MANAGER, hashedManager);
    }

    this.logger.log('Test users synchronization complete.');
  }

  private async upsertUser(email: string, role: Role, password?: string) {
    const normalizedEmail = email.toLowerCase().trim();
    let user = await this.userRepo.findOneBy({ email: normalizedEmail });

    if (user) {
      // Update existing user to match the requested role and password
      user.role = role;
      if (password) user.password = password;
      await this.userRepo.save(user);
    } else {
      // Create new user
      user = this.userRepo.create({
        email: normalizedEmail,
        role,
        password,
        isActive: true,
      });
      await this.userRepo.save(user);
      this.logger.log(`Created new test user: ${normalizedEmail} as ${role}`);
    }
  }
}
