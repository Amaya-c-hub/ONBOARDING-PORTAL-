import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity } from '../documents/document.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ExpiryService {
  private readonly logger = new Logger(ExpiryService.name);

  constructor(
    @InjectRepository(DocumentEntity)
    private readonly repo: Repository<DocumentEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Runs every day at 9:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkExpiringDocuments() {
    this.logger.log('Running expiry check...');

    const today = new Date();
    const in7Days = new Date();
    in7Days.setDate(today.getDate() + 7);

    // 1. Documents expiring within 7 days
    const expiringSoon = await this.repo
      .createQueryBuilder('doc')
      .where('doc.expiryDate IS NOT NULL')
      .andWhere('doc.expiryDate > :today', { today })
      .andWhere('doc.expiryDate <= :in7Days', { in7Days })
      .andWhere('doc.status = :status', { status: 'approved' })
      .getMany();

    // 2. Already expired documents
    const alreadyExpired = await this.repo
      .createQueryBuilder('doc')
      .where('doc.expiryDate IS NOT NULL')
      .andWhere('doc.expiryDate <= :today', { today })
      .andWhere('doc.status = :status', { status: 'approved' })
      .getMany();

    this.logger.log(
      `Found ${expiringSoon.length} expiring soon, ${alreadyExpired.length} already expired`,
    );

    // handle expiring soon — notify candidate + HR
    for (const doc of expiringSoon) {
      const expiryDate = new Date(doc.expiryDate);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      // notify candidate
      await this.notificationsService.sendExpiryReminder({
        candidateEmail: `${doc.candidateId}@example.com`,
        candidateName: doc.candidateId,
        documentType: doc.documentType ?? 'document',
        expiryDate: expiryDate.toISOString().split('T')[0],
        daysUntilExpiry,
      });

      // notify HR
      await this.notificationsService.sendHrExpiryAlert({
        candidateId: doc.candidateId,
        documentType: doc.documentType ?? 'document',
        expiryDate: expiryDate.toISOString().split('T')[0],
        daysUntilExpiry,
        docId: doc.id,
      });

      this.logger.log(
        `Expiry reminder sent for doc ${doc.id} — expires in ${daysUntilExpiry} days`,
      );
    }

    // handle already expired — notify candidate + HR
    for (const doc of alreadyExpired) {
      const expiryDate = new Date(doc.expiryDate);

      await this.notificationsService.sendExpiryReminder({
        candidateEmail: `${doc.candidateId}@example.com`,
        candidateName: doc.candidateId,
        documentType: doc.documentType ?? 'document',
        expiryDate: expiryDate.toISOString().split('T')[0],
        daysUntilExpiry: 0,
      });

      await this.notificationsService.sendHrExpiryAlert({
        candidateId: doc.candidateId,
        documentType: doc.documentType ?? 'document',
        expiryDate: expiryDate.toISOString().split('T')[0],
        daysUntilExpiry: 0,
        docId: doc.id,
      });

      this.logger.log(`Expired doc alert sent for doc ${doc.id}`);
    }
  }

  // Manual trigger for testing
  async triggerExpiryCheck() {
    await this.checkExpiringDocuments();
    return { message: 'Expiry check completed' };
  }
}