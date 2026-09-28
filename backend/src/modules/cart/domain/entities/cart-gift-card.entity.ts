import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
} from 'typeorm';
import { z } from 'zod';
import { GiftCard } from '../../../promotions/domain/entities/gift-card.entity.js';

/** A gift card ("bono") attached to a cart via `POST /cart/apply-giftcard`. */
@Entity('cart_gift_cards')
@Unique(['cartId', 'giftCardId'])
export class CartGiftCard {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'cart_id', type: 'uuid' })
  cartId!: string;

  @Column({ name: 'gift_card_id', type: 'uuid' })
  giftCardId!: string;

  @ManyToOne(() => GiftCard, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'gift_card_id' })
  giftCard?: Relation<GiftCard>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

/**
 * Esquema base que representa un registro completo de Bono Aplicado al Carrito en la base de datos
 */
export const cartGiftCardSchema = z.object({
  id: z.string().uuid(),
  cartId: z.string().uuid(),
  giftCardId: z.string().uuid(),
  createdAt: z.date(),
});

/**
 * Esquema para validar los datos necesarios al crear un nuevo Bono Aplicado al Carrito
 */
export const createCartGiftCardSchema = cartGiftCardSchema.omit({
  id: true,
  createdAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type CartGiftCardInput = z.infer<typeof cartGiftCardSchema>;
export type CreateCartGiftCardInput = z.infer<typeof createCartGiftCardSchema>;
