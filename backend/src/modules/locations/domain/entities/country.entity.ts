import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { z } from 'zod';
import { Department } from './department.entity.js';

@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ name: 'iso_code', type: 'varchar', length: 3, unique: true })
  isoCode!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => Department, (department) => department.country)
  departments?: Department[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

/**
 * Esquema base que representa un registro completo de País en la base de datos
 */
export const countrySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  isoCode: z.string().min(1).max(3),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Esquema para validar los datos necesarios al crear un nuevo País
 */
export const createCountrySchema = countrySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type CountryInput = z.infer<typeof countrySchema>;
export type CreateCountryInput = z.infer<typeof createCountrySchema>;
