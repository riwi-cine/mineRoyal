import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { z } from 'zod';

/** How a promotion's `discountValue` is interpreted. */
export const promotionDiscountTypeSchema = z.enum(['PERCENTAGE', 'FIXED']);
export type PromotionDiscountType = z.infer<typeof promotionDiscountTypeSchema>;

/**
 * A confectionery promotion (HU-011 "Promociones").
 * When `productId` is null the promotion applies to the whole concession
 * subtotal; otherwise it only discounts that specific product's line.
 * `combinable` backs RN-048: administration can forbid a promotion from
 * stacking with other active promotions on the same cart.
 */
@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId!: string | null;

  @Column({ name: 'discount_type', type: 'varchar', length: 20 })
  discountType!: PromotionDiscountType;

  @Column({ name: 'discount_value', type: 'decimal', precision: 10, scale: 2 })
  discountValue!: number;

  @Column({ type: 'boolean', default: true })
  combinable!: boolean;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

/**
 * Esquema base que representa un registro completo de Promoción en la base de datos
 */
export const promotionSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(150),
  productId: z.string().uuid().nullable(),
  discountType: promotionDiscountTypeSchema,
  discountValue: z.coerce.number().nonnegative(),
  combinable: z.boolean().default(true),
  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Esquema para validar los datos necesarios al crear una nueva Promoción
 */
export const createPromotionSchema = promotionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type PromotionInput = z.infer<typeof promotionSchema>;
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
