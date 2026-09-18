import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { z } from 'zod';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 30 })
  status!: string;

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
  userId: z.string().uuid(),
  status: z.string().min(1).max(30),
  expiresAt: z.date(),
  createdAt: z.date(),
});

/**
 * Esquema para validar los datos necesarios al crear un nuevo Carrito
 */
export const createCartSchema = cartSchema.omit({
  id: true,
  createdAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type CartInput = z.infer<typeof cartSchema>;
export type CreateCartInput = z.infer<typeof createCartSchema>;
