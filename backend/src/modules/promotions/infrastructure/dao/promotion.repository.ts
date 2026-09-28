import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Promotion } from '../../domain/entities/promotion.entity.js';

@Injectable()
export class PromotionRepository {
  constructor(
    @InjectRepository(Promotion)
    private readonly repository: Repository<Promotion>,
  ) {}

  /**
   * Active promotions applicable to a cart: cart-wide ones (`productId: null`)
   * plus the ones scoped to a product currently in the cart's confectionery items.
   */
  findActiveApplicable(productIds: string[]): Promise<Promotion[]> {
    return this.repository.find({
      where: [
        { active: true, productId: IsNull() },
        ...(productIds.length > 0 ? [{ active: true, productId: In(productIds) }] : []),
      ],
    });
  }
}
