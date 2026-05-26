import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { OpenSignService } from './opensign.service';

@Module({
  providers: [S3Service, OpenSignService],
  exports: [S3Service, OpenSignService],
})
export class IntegrationsModule {}
