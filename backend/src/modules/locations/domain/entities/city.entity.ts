import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { z } from 'zod';
import { Cinema } from './cinema.entity.js';
import { Department } from './department.entity.js';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'department_id', type: 'uuid' })
  departmentId!: string;

  @ManyToOne(() => Department, (department) => department.cities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'department_id' })
  department?: Relation<Department>;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => Cinema, (cinema) => cinema.city)
  cinemas?: Cinema[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
/**
 * Esquema base que representa un registro completo de Ciudad en la base de datos
 */
export const citySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  departmentId: z.string().uuid(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Esquema para validar los datos necesarios al crear una nueva Ciudad
 */
export const createCitySchema = citySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type CityInput = z.infer<typeof citySchema>;
export type CreateCityInput = z.infer<typeof createCitySchema>;
