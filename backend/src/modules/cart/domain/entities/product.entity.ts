import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { z } from 'zod';

/** Confectionery catalog item that can be added to a cart. */
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'int', default: 0 })
  stock!: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

/**
 * Esquema base que representa un registro completo de Producto en la base de datos
 */
export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(150),
  imageUrl: z.string().url().max(500).nullable(),
  price: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative().default(0),
  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Esquema para validar los datos necesarios al crear un nuevo Producto
 */
export const createProductSchema = productSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type ProductInput = z.infer<typeof productSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
