import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { z } from 'zod';
import { City } from '../../../locations/domain/entities/city.entity.js';
import { Country } from '../../../locations/domain/entities/country.entity.js';
import { Department } from '../../../locations/domain/entities/department.entity.js';

/** Stores the location a user last selected to browse the billboard. */
@Entity('user_locations')
export class UserLocation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @Column({ name: 'country_id', type: 'uuid' })
  countryId!: string;

  @ManyToOne(() => Country, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'country_id' })
  country?: Relation<Country>;

  @Column({ name: 'department_id', type: 'uuid' })
  departmentId!: string;

  @ManyToOne(() => Department, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'department_id' })
  department?: Relation<Department>;

  @Column({ name: 'city_id', type: 'uuid' })
  cityId!: string;

  @ManyToOne(() => City, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'city_id' })
  city?: Relation<City>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

/**
 * Esquema base que representa un registro completo de Ubicación de Usuario en la base de datos
 */
export const userLocationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  countryId: z.string().uuid(),
  departmentId: z.string().uuid(),
  cityId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Esquema para validar los datos necesarios al crear una nueva Ubicación de Usuario
 */
export const createUserLocationSchema = userLocationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type UserLocationInput = z.infer<typeof userLocationSchema>;
export type CreateUserLocationInput = z.infer<typeof createUserLocationSchema>;
