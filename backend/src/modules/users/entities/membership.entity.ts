import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { z } from 'zod';

/** RN-047: a user's membership, whose discount is applied automatically to a cart's tickets. */
@Entity('memberships')
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'integer', unique: true })
  userId!: number;

  @Column({ type: 'varchar', length: 30 })
  tier!: string;

  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2 })
  discountPercent!: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

/**
 * Esquema base que representa un registro completo de Membresía en la base de datos
 */
export const membershipSchema = z.object({
  id: z.string().uuid(),
  userId: z.number().int().positive(),
  tier: z.string().min(1).max(30),
  discountPercent: z.coerce.number().min(0).max(100),
  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Esquema para validar los datos necesarios al crear una nueva Membresía
 */
export const createMembershipSchema = membershipSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type MembershipInput = z.infer<typeof membershipSchema>;
export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;
