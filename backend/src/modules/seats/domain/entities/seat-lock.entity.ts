import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { z } from 'zod';
import { Seats } from './seat.entity.js';

@Entity('seat_locks')
@Unique(['functionId', 'seatId'])
export class SeatLock {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'cart_id', type: 'uuid' })
  cartId!: string;

  @Column({ name: 'function_id', type: 'uuid' })
  functionId!: string;

  @Column({ name: 'seat_id', type: 'uuid' })
  seatId!: string;

  @ManyToOne(() => Seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seat_id' })
  seat?: Seats;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

/**
 * Esquema base que representa un registro completo de Bloqueo de Asiento en la base de datos
 */
export const seatLockSchema = z.object({
  id: z.string().uuid(),
  cartId: z.string().uuid(),
  functionId: z.string().uuid(),
  seatId: z.string().uuid(),
  expiresAt: z.date(),
  createdAt: z.date(),
});

/**
 * Esquema para validar los datos necesarios al crear un nuevo Bloqueo de Asiento
 */
export const createSeatLockSchema = seatLockSchema.omit({
  id: true,
  createdAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type SeatLockInput = z.infer<typeof seatLockSchema>;
export type CreateSeatLockInput = z.infer<typeof createSeatLockSchema>;
