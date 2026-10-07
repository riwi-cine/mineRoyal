import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CartConcessionItem } from '../entities/cart-concession-item.entity.js';
import { CartGiftCard } from '../entities/cart-gift-card.entity.js';
import { Product } from '../entities/product.entity.js';

/**
 * Cart items repository (HU-011)
 * --------------------------------
 * Owns the confectionery catalog (`products`) plus the two join tables that
 * hang off a cart: its concession line items and the gift cards applied to it.
 */
@Injectable()
export class CartItemDao {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(CartConcessionItem)
    private readonly concessionItemRepository: Repository<CartConcessionItem>,
    @InjectRepository(CartGiftCard)
    private readonly cartGiftCardRepository: Repository<CartGiftCard>,
  ) {}

  findProductsByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.productRepository.find({ where: { id: In(ids) } });
  }

  findConcessionItemsByCartId(cartId: string): Promise<CartConcessionItem[]> {
    return this.concessionItemRepository.find({ where: { cartId }, relations: ['product'] });
  }

  async upsertConcessionItem(cartId: string, productId: string, quantity: number, unitPrice: number): Promise<void> {
    const existing = await this.concessionItemRepository.findOne({ where: { cartId, productId } });
    const entity = this.concessionItemRepository.merge(
      existing ?? this.concessionItemRepository.create({ cartId, productId }),
      { quantity, unitPrice },
    );
    await this.concessionItemRepository.save(entity);
  }

  async removeConcessionItem(cartId: string, productId: string): Promise<void> {
    await this.concessionItemRepository.delete({ cartId, productId });
  }

  async clearConcessionItems(cartId: string): Promise<void> {
    await this.concessionItemRepository.delete({ cartId });
  }

  findGiftCardsByCartId(cartId: string): Promise<CartGiftCard[]> {
    return this.cartGiftCardRepository.find({ where: { cartId }, relations: ['giftCard'] });
  }

  async addGiftCard(cartId: string, giftCardId: string): Promise<void> {
    await this.cartGiftCardRepository
      .createQueryBuilder()
      .insert()
      .into(CartGiftCard)
      .values({ cartId, giftCardId })
      .orIgnore()
      .execute();
  }

  async clearGiftCards(cartId: string): Promise<void> {
    await this.cartGiftCardRepository.delete({ cartId });
  }
}
