import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { z } from 'zod';
import { City } from './city.entity.js';

@Entity('cinemas')
export class Cinema {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ name: 'city_id', type: 'uuid' })
  cityId!: string;

  @ManyToOne(() => City, (city) => city.cinemas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'city_id' })
  city?: City;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

/**
 * Esquema base que representa un registro completo de Cine en la base de datos
 */
export const cinemaSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(150),
  cityId: z.string().uuid(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Esquema para validar los datos necesarios al crear un nuevo Cine
 */
export const createCinemaSchema = cinemaSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type CinemaInput = z.infer<typeof cinemaSchema>;
export type CreateCinemaInput = z.infer<typeof createCinemaSchema>;
