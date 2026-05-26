import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEvent } from '../audit/entities/audit-event.entity';

@Injectable()
export class CandidateInteractionService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(CandidateInteractionService.name);

  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditRepo: Repository<AuditEvent>,
    private readonly eventEmitter: EventEmitter2
  ) {}

  private async initMailer() {
    if (process.env.SMTP_HOST) {
      const port = parseInt(process.env.SMTP_PORT || '587', 10);
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: port === 465, // true for SSL on 465, false for STARTTLS on 587
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false, // Allow self-signed certs in dev
        },
      });
      this.logger.log(`SMTP initialized via ${process.env.SMTP_HOST}:${port}`);
    } else {
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.logger.log(`Ethereal email initialized: ${testAccount.user}`);
        this.logger.log(`Preview emails at: https://ethereal.email/login (user: ${testAccount.user}, pass: ${testAccount.pass})`);
      } catch (e) {
        this.logger.warn('Failed to create Nodemailer test account, falling back to local mock.');
        this.transporter = nodemailer.createTransport({
          host: 'localhost',
          port: 1025,
          ignoreTLS: true,
          auth: { user: 'user', pass: 'pass' },
        });
      }
    }
  }

  async sendOfferEmail(
    candidate: any,
    offer: any,
    pdfBuffer: Buffer,
    magicLinkUrl: string,
  ) {
    const candidateName = candidate.firstName
      ? `${candidate.firstName} ${candidate.lastName ?? ''}`.trim()
      : candidate.email;

    try {
      this.logger.log(`Delegating offer email for ${candidate.email} to Event-Driven Notifications Layer...`);
      
      this.eventEmitter.emit('notification.offer', {
        candidateEmail: candidate.email,
        candidateName: candidateName,
        offerUrl: magicLinkUrl,
        pdfBuffer: pdfBuffer,
      });

      const newAudit = this.auditRepo.create({
        action: 'EMAIL_DELEGATED_TO_TRACKING_LAYER',
        userId: candidate.id,
        meta: { source: 'Offer workflow handed over to event emitter' },
        layer: 'HR_PORTAL'
      });
      await this.auditRepo.save(newAudit);

    } catch (error) {
      this.logger.error(`Critical failure in notification delegation for ${candidate.email}`, error);
    }
  }

  async sendDocumentRequestEmail(candidate: any, magicLinkUrl: string) {
    const candidateName = candidate.firstName
      ? `${candidate.firstName} ${candidate.lastName ?? ''}`.trim()
      : candidate.email;

    try {
      this.logger.log(`Delegating document request to Event-Driven Notifications Layer for ${candidate.email}...`);
      this.eventEmitter.emit('notification.document_request', {
        candidateEmail: candidate.email,
        candidateName: candidateName,
        magicLinkUrl: magicLinkUrl,
      });

      const newAudit = this.auditRepo.create({
        action: 'EMAIL_INTERACTION_DOC_REQUEST_SENT',
        userId: candidate.id,
        meta: { source: `Verification link dispatched to ${candidate.email}` },
        layer: 'HR_PORTAL'
      });
      await this.auditRepo.save(newAudit);
    } catch (error) {
      this.logger.error(`Failed to dispatch document request to ${candidate.email}`, error);
      throw error;
    }
  }

  async sendHrOtpEmail(email: string, otp: string) {
    try {
      this.logger.log(`Delegating HR OTP email to Event-Driven Notifications Layer for ${email}...`);
      this.eventEmitter.emit('notification.otp', { email, otp, expiresIn: 600 });
    } catch (error) {
      this.logger.error(`Failed to dispatch HR OTP to ${email}`, error);
    }
  }
}
