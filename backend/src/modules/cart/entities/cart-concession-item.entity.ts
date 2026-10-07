import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { z } from 'zod';
import { Product } from './product.entity.js';

/**
 * A confectionery line item within a cart (HU-011 "Confitería").
 * `cartId` intentionally has no FK, matching the rest of the codebase's
 * convention of not constraining cross-aggregate references (see SeatLock.cartId).
 */
@Entity('cart_concession_items')
@Unique(['cartId', 'productId'])
export class CartConcessionItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'cart_id', type: 'uuid' })
  cartId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product?: Relation<Product>;

  @Column({ type: 'int' })
  quantity!: number;

  /** Snapshot of the product's price at the moment it was added, so later price changes don't retroactively alter the cart. */
  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

/**
 * Esquema base que representa un registro completo de Ítem de Confitería del Carrito en la base de datos
 */
export const cartConcessionItemSchema = z.object({
  id: z.string().uuid(),
  cartId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Esquema para validar los datos necesarios al crear un nuevo Ítem de Confitería del Carrito
 */
export const createCartConcessionItemSchema = cartConcessionItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type CartConcessionItemInput = z.infer<typeof cartConcessionItemSchema>;
export type CreateCartConcessionItemInput = z.infer<typeof createCartConcessionItemSchema>;
