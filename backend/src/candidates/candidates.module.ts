import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateEntity } from './candidate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CandidateEntity])],
  providers: [],
  exports: [TypeOrmModule],
})
export class CandidatesModule {}
