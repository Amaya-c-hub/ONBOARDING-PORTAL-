import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ExpiryService } from './expiry.service';
import { DocumentEntity } from '../documents/document.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([DocumentEntity]),
    ConfigModule,
    NotificationsModule,
  ],
  providers: [ExpiryService],
  exports: [ExpiryService],
})
export class ExpiryModule {}