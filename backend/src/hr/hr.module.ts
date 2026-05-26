import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrService } from './hr.service';
import { HrController } from './hr.controller';
import { CandidateInteractionService } from './candidate-interaction.service';
import { CandidatePortalService } from './candidate-portal.service';
import { CandidatePortalController } from './candidate-portal.controller';
import { IntegrationsModule } from '../integrations/integrations.module';

import { CandidateEntity } from '../candidates/candidate.entity';
import { OfferEntity } from '../offers/offer.entity';
import { DocumentEntity } from '../documents/document.entity';
import { User } from '../auth/entities/user.entity';
import { AuditEvent } from '../audit/entities/audit-event.entity';

@Module({
  imports: [
    IntegrationsModule,
    MulterModule.register({ storage: memoryStorage() }),
    TypeOrmModule.forFeature([CandidateEntity, OfferEntity, DocumentEntity, User, AuditEvent]),
  ],
  providers: [HrService, CandidateInteractionService, CandidatePortalService],
  controllers: [HrController, CandidatePortalController],
  exports: [CandidateInteractionService, HrService],
})
export class HrModule {}
