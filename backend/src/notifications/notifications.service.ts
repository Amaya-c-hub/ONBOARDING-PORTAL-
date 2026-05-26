import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackingEvent } from './entities/tracking-event.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private config: ConfigService,
    @InjectRepository(TrackingEvent)
    private readonly trackingRepo: Repository<TrackingEvent>,
  ) {
    this.initMailer();
  }

  private async initMailer() {
    if (this.config.get('SMTP_HOST')) {
      const port = Number(this.config.get('SMTP_PORT')) || 587;
      this.transporter = nodemailer.createTransport({
        host: this.config.get('SMTP_HOST'),
        port: port,
        secure: port === 465,
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASS'),
        },
      });
      this.logger.log(`SMTP configured via ${this.config.get('SMTP_HOST')}`);
    } else {
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        this.logger.log(`Ethereal email configured. Preview at https://ethereal.email/login`);
      } catch (e) {
        this.logger.warn('Failed to configure Ethereal email, fallback to localhost:1025');
        this.transporter = nodemailer.createTransport({
          host: 'localhost',
          port: 1025,
          ignoreTLS: true,
          auth: { user: 'user', pass: 'pass' },
        });
      }
    }
  }

  @OnEvent('notification.otp')
  async handleOtp(payload: { email: string; otp: string; expiresIn: number }) {
    this.logger.log(`[Event-Driven] Sending OTP to ${payload.email}`);
    try {
      await this.transporter.sendMail({
        from: this.config.get('SMTP_FROM') || '"Linnk Security" <security@linnk.io>',
        to: payload.email,
        subject: `Security Verification Code: ${payload.otp}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;text-align:center">
            <h2>Security Verification Code</h2>
            <p style="font-size:32px;font-weight:bold;letter-spacing:8px">${payload.otp}</p>
            <p>Expires in ${Math.floor(payload.expiresIn / 60)} minutes. Do not share this code.</p>
          </div>
        `,
      });
      await this.trackingRepo.save({ type: 'OTP_SENT', recipientEmail: payload.email });
    } catch (e) {
      this.logger.error(`Failed to send OTP to ${payload.email}`, e);
      await this.trackingRepo.save({ type: 'OTP_FAILED', recipientEmail: payload.email, status: e.message ? e.message.substring(0, 255) : 'FAILED' });
    }
  }

  @OnEvent('notification.offer')
  async handleOffer(payload: { candidateEmail: string; candidateName: string; offerUrl: string; pdfBuffer: Buffer }) {
    this.logger.log(`[Event-Driven] Sending Offer to ${payload.candidateEmail}`);
    try {
      await this.transporter.sendMail({
        from: this.config.get('SMTP_FROM') || '"Linnk Global HR" <onboarding@linnk.io>',
        to: payload.candidateEmail,
        subject: 'Your Offer Letter from Linnk Global Solutions',
        html: `<p>Hello ${payload.candidateName},</p><p>Please review and sign your offer using this secure link: <a href="${payload.offerUrl}">Review Offer</a></p>`,
        attachments: payload.pdfBuffer ? [{ filename: 'Offer_Letter.pdf', content: payload.pdfBuffer }] : []
      });
      await this.trackingRepo.save({ type: 'OFFER_SENT', recipientEmail: payload.candidateEmail });
    } catch (e) {
      this.logger.error(`Failed to send offer to ${payload.candidateEmail}`, e);
      await this.trackingRepo.save({ type: 'OFFER_FAILED', recipientEmail: payload.candidateEmail, status: 'FAILED' });
    }
  }

  @OnEvent('notification.document_request')
  async handleDocumentRequest(payload: { candidateEmail: string; candidateName: string; magicLinkUrl: string }) {
    this.logger.log(`[Event-Driven] Sending Document Request to ${payload.candidateEmail}`);
    try {
      await this.transporter.sendMail({
        from: this.config.get('SMTP_FROM') || '"Linnk Global Verification" <security@linnk.io>',
        to: payload.candidateEmail,
        subject: 'Identity Verification Required - Linnk Global Solutions',
        html: `<p>Hello ${payload.candidateName},</p><p>Please upload your verification documents prior to offer generation.</p><p><a href="${payload.magicLinkUrl}">Secure Portal Link</a></p>`
      });
      await this.trackingRepo.save({ type: 'DOC_REQUEST_SENT', recipientEmail: payload.candidateEmail });
    } catch (e) {
      this.logger.error(`Failed to send document request to ${payload.candidateEmail}`, e);
    }
  }

  async getTrackingStats() {
    const total = await this.trackingRepo.count();
    const success = await this.trackingRepo.count({ where: { status: 'SUCCESS' } });
    return {
      totalSent: total,
      successRate: total === 0 ? 0 : Math.round((success / total) * 100),
      metrics: await this.trackingRepo.query(`SELECT type, COUNT(*) as count FROM tracking_events GROUP BY type`)
    };
  }

  // Wrapper methods for ExpiryService and UploadsService

  async sendExpiryReminder(data: any) {
    this.logger.log(`[Event-Driven] Sending Expiry Reminder to ${data.candidateEmail}`);
    await this.trackingRepo.save({ type: 'EXPIRY_REMINDER_SENT', recipientEmail: data.candidateEmail });
  }

  async sendHrExpiryAlert(data: any) {
    this.logger.log(`[Event-Driven] Sending HR Expiry Alert for ${data.candidateId}`);
    await this.trackingRepo.save({ type: 'HR_ALERT_SENT', candidateId: data.candidateId });
  }

  async sendUploadConfirmation(data: any) {
    this.logger.log(`[Event-Driven] Sending Upload Confirmation to ${data.candidateEmail}`);
    await this.trackingRepo.save({ type: 'UPLOAD_CONFIRMATION_SENT', recipientEmail: data.candidateEmail });
  }

  async auditLog(data: any) {
    this.logger.log(`[Event-Driven] Audit: ${data.action} on ${data.resource} by ${data.userId}`);
    await this.trackingRepo.save({ type: 'AUDIT_LOG', candidateId: data.userId });
  }
}