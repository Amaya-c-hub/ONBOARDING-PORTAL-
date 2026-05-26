import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { S3Service } from './s3/s3.service';
import { DocumentsModule } from '../documents/documents.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ExpiryModule } from '../expiry/expiry.module';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({ storage: memoryStorage() }),
    DocumentsModule,
    ExpiryModule,
    NotificationsModule,
  ],
  controllers: [UploadsController],
  providers: [UploadsService, S3Service],
  exports: [UploadsService, S3Service],
})
export class UploadsModule {}