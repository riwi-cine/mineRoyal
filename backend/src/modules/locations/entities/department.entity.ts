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
import { City } from './city.entity.js';
import { Country } from './country.entity.js';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'country_id', type: 'uuid' })
  countryId!: string;

  @ManyToOne(() => Country, (country) => country.departments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'country_id' })
  country?: Relation<Country>;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => City, (city) => city.department)
  cities?: City[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

/**
 * Esquema base que representa un registro completo de Departamento en la base de datos
 */
export const departmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  countryId: z.string().uuid(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Esquema para validar los datos necesarios al crear un nuevo Departamento
 */
export const createDepartmentSchema = departmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type DepartmentInput = z.infer<typeof departmentSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
