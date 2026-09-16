import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { z } from 'zod';
import { Room } from '../../../seats/domain/entities/room.entity.js';
import { FunctionType } from './function-type.entity.js';

@Entity('functions')
export class CinemaFunction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'movie_id', type: 'uuid' })
  movieId!: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId!: string;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room?: Room;

  @Column({ name: 'function_type_id', type: 'uuid' })
  functionTypeId!: string;

  @ManyToOne(() => FunctionType, (functionType) => functionType.functions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'function_type_id' })
  functionType?: FunctionType;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt!: Date;

  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
  basePrice!: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}

/**
 * Esquema base que representa un registro completo de Función en la base de datos
 */
export const functionSchema = z.object({
  id: z.string().uuid(),
  movieId: z.string().uuid(),
  roomId: z.string().uuid(),
  functionTypeId: z.string().uuid(),
  startsAt: z.date(),
  basePrice: z.coerce.number().nonnegative(),
  active: z.boolean().default(true),
});

/**
 * Esquema para validar los datos necesarios al crear una nueva Función
 */
export const createFunctionSchema = functionSchema.omit({
  id: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type FunctionInput = z.infer<typeof functionSchema>;
export type CreateFunctionInput = z.infer<typeof createFunctionSchema>;
