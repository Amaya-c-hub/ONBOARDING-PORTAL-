import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { HealthController } from './health.controller';
import { UploadModule } from './upload/upload.module';
import { UploadsModule } from './uploads/uploads.module';
import { DocumentsModule } from './documents/documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ExpiryModule } from './expiry/expiry.module';
import { CandidatesModule } from './candidates/candidates.module';
import { OffersModule } from './offers/offers.module';
import { HrModule } from './hr/hr.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 20 }]),
    TypeOrmModule.forRootAsync({
      useFactory: (cfg: ConfigService) => ({
        type:             'postgres',
        url:              cfg.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize:      false, // Disabled to prevent conflicts with shared Neon DB tables
        ssl: cfg.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    AuditModule,
    UploadModule,
    UploadsModule,
    DocumentsModule,
    NotificationsModule,
    ExpiryModule,
    CandidatesModule,
    OffersModule,
    HrModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
