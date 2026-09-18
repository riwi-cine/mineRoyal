import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { z } from 'zod';

@Entity('currencies')
export class Currency {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 3, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 10 })
  symbol!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}

/**
 * Esquema base que representa un registro completo de Moneda en la base de datos
 */
export const currencySchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).max(3),
  symbol: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional(),
});

/**
 * Esquema para validar los datos necesarios al crear una nueva Moneda
 */
export const createCurrencySchema = currencySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type CurrencyInput = z.infer<typeof currencySchema>;
export type CreateCurrencyInput = z.infer<typeof createCurrencySchema>;
