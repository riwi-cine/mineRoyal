import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { z } from 'zod';
import { Room } from './room.entity.js';

/**
 * Canonical seat categories. Single source of truth reused by the entity's
 * `seatType` column and by the seat-map DTOs (HU-010) so both layers agree
 * on the same set of values instead of drifting into free-form aliases.
 */
export const seatCategorySchema = z.enum(['STANDARD', 'VIP', 'PREFERENTIAL', 'DISABLED']);
export type SeatCategory = z.infer<typeof seatCategorySchema>;
export const SEAT_CATEGORIES = seatCategorySchema.options;

@Entity('seats')
@Unique(['roomId', 'row', 'number'])
export class Seats {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId!: string;

  @ManyToOne(() => Room, (room) => room.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room?: Relation<Room>;

  @Column({ type: 'varchar', length: 5 })
  row!: string;

  @Column({ type: 'varchar', length: 5 })
  number!: string;

  @Column({ name: 'seat_type', type: 'varchar', length: 30 })
  seatType!: SeatCategory;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

/**
 * Esquema base que representa un registro completo de Asiento en la base de datos
 */
export const seatSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  row: z.string().min(1).max(5),
  number: z.string().min(1).max(5),
  seatType: seatCategorySchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Esquema para validar los datos necesarios al crear un nuevo Asiento
 */
export const createSeatSchema = seatSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type SeatInput = z.infer<typeof seatSchema>;
export type CreateSeatInput = z.infer<typeof createSeatSchema>;
