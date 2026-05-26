import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AuditEvent, AuditAction } from './entities/audit-event.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditEvent)
    private repo: Repository<AuditEvent>,
    private configSvc: ConfigService,
  ) {}

  /**
   * Main logging method. 
   * Updated as per new requirements: Forwards all logs to Intern 5's central API.
   * Local DB insertion is kept for now until remote logs are confirmed.
   */
  async log(params: { action: string; email?: string; userId?: string; ip?: string; meta?: any }) {
    const resource = String(params.action).includes('OTP') ? 'auth/otp' : 'auth/login';
    
    // 1. Log locally (Keep until remote confirmation, as requested)
    try {
      const event = this.repo.create({
        action: params.action,
        userId: params.userId,
        email: params.email,
        ip: params.ip,
        meta: { ...params.meta, email: params.email },
        resource,
        layer: 'auth',
      });
      await this.repo.save(event);
    } catch (e) {
      this.logger.error('Failed to log locally', e);
    }

    // Forwarding to central API is no longer needed as we are in the monolith
    this.logger.log(`[Audit Log] ${params.action} for ${params.email || params.userId}`);
  }

  async getEventsByEmail(email: string) {
    return this.repo.find({
      where: { email: email.toLowerCase().trim() },
      order: { createdAt: 'DESC' as any },
      take: 50,
    });
  }
}
