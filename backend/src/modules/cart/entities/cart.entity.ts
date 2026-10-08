import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { z } from 'zod';

/**
 * Lifecycle of a shopping cart (HU-011).
 * ACTIVE: usable, can still be modified.
 * EXPIRED: RN-046 — ten minutes without activity elapsed.
 * CANCELLED: explicitly emptied/discarded via DELETE /cart.
 * CONVERTED: the cart was turned into an order (out of scope for HU-011, reserved for the payment flow).
 */
export const cartStatusSchema = z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED', 'CONVERTED']);
export type CartStatus = z.infer<typeof cartStatusSchema>;
export const CART_STATUSES = cartStatusSchema.options;

@Entity('carts')
export class Cart {
  /**
   * Generated client-side (or by POST /cart when omitted) so it can be reused
   * as the `cartId` already passed to HU-010's `lock-seats`/`release-seats`
   * endpoints before the cart itself formally exists.
   */
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'integer' })
  userId!: number;

  @Column({ type: 'varchar', length: 30, default: 'ACTIVE' })
  status!: CartStatus;

  /** RN-047: whether the user's membership discount has been applied to this cart. */
  @Column({ name: 'membership_applied', type: 'boolean', default: false })
  membershipApplied!: boolean;

  /** RN-046: refreshed on every mutation; the cart expires ten minutes after the last one. */
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

/**
 * Esquema base que representa un registro completo de Carrito en la base de datos
 */
export const cartSchema = z.object({
  id: z.string().uuid(),
  userId: z.number().int().positive(),
  status: cartStatusSchema,
  membershipApplied: z.boolean().default(false),
  expiresAt: z.date(),
  createdAt: z.date(),
});

/**
 * Esquema para validar los datos necesarios al crear un nuevo Carrito en persistencia
 */
export const cartInsertSchema = cartSchema.omit({
  id: true,
  createdAt: true,
});
export const createCartSchema = cartInsertSchema;

// Tipos inferidos a partir de los esquemas de Zod
export type CartInput = z.infer<typeof cartSchema>;
export type CartInsertInput = z.infer<typeof cartInsertSchema>;
export type CreateCartInput = CartInsertInput;
