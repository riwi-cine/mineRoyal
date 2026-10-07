import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftCard } from './entities/gift-card.entity.js';
import { Promotion } from './entities/promotion.entity.js';
import { GiftCardDao } from './dao/gift-card.dao.js';
import { PromotionDao } from './dao/promotion.dao.js';

@Module({
  imports: [TypeOrmModule.forFeature([Promotion, GiftCard])],
  providers: [PromotionDao, GiftCardDao],
  exports: [PromotionDao, GiftCardDao],
})
export class PromotionsModule {}
