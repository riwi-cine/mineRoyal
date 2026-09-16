import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { z } from 'zod';
import { CinemaFunction } from './function.entity.js';

@Entity('function_types')
export class FunctionType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  projection!: string;

  @Column({ type: 'varchar', length: 50 })
  language!: string;

  @OneToMany(() => CinemaFunction, (fn) => fn.functionType)
  functions?: CinemaFunction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}

/**
 * Esquema base que representa un registro completo de Tipo de Función en la base de datos
 */
export const functionTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  projection: z.string().min(1).max(50),
  language: z.string().min(1).max(50),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional(),
});

/**
 * Esquema para validar los datos necesarios al crear un nuevo Tipo de Función
 */
export const createFunctionTypeSchema = functionTypeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type FunctionTypeInput = z.infer<typeof functionTypeSchema>;
export type CreateFunctionTypeInput = z.infer<typeof createFunctionTypeSchema>;
