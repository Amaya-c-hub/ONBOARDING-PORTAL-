import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuditEvent } from './entities/audit-event.entity';
import { AuditService } from './audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditEvent]), ConfigModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
