import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftCard } from './domain/entities/gift-card.entity.js';
import { Promotion } from './domain/entities/promotion.entity.js';
import { GiftCardRepository } from './infrastructure/dao/gift-card.repository.js';
import { PromotionRepository } from './infrastructure/dao/promotion.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([Promotion, GiftCard])],
  providers: [PromotionRepository, GiftCardRepository],
  exports: [PromotionRepository, GiftCardRepository],
})
export class PromotionsModule {}
