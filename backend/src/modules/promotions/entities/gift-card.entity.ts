import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { z } from 'zod';

/** A prepaid gift card ("bono") that can be redeemed against a cart's total. */
@Entity('gift_cards')
export class GiftCard {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balance!: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

/**
 * Esquema base que representa un registro completo de Bono en la base de datos
 */
export const giftCardSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).max(50),
  balance: z.coerce.number().nonnegative(),
  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Esquema para validar los datos necesarios al crear un nuevo Bono
 */
export const createGiftCardSchema = giftCardSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type GiftCardInput = z.infer<typeof giftCardSchema>;
export type CreateGiftCardInput = z.infer<typeof createGiftCardSchema>;
