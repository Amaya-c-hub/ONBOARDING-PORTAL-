import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfferEntity } from './offer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OfferEntity])],
  providers: [],
  exports: [TypeOrmModule],
})
export class OffersModule {}
