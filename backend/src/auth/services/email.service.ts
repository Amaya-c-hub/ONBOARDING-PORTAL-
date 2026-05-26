import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private config: ConfigService,
    private eventEmitter: EventEmitter2
  ) {}

  async sendOtp(email: string, code: string): Promise<void> {
    const expiresIn = Math.floor(Number(this.config.get<number>('OTP_TTL_MS', 600000)) / 1000);
    this.eventEmitter.emit('notification.otp', { email, otp: code, expiresIn });
    this.logger.log(`[EmailService] Emitted notification.otp event for ${email}`);
  }
}
