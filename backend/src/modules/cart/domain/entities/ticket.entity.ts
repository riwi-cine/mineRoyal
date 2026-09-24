import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { z } from 'zod';
import { CinemaFunction } from '../../../functions/domain/entities/function.entity.js';
import { Seats } from '../../../seats/domain/entities/seat.entity.js';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ name: 'function_id', type: 'uuid' })
  functionId!: string;

  @ManyToOne(() => CinemaFunction, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'function_id' })
  function?: Relation<CinemaFunction>;

  @Column({ name: 'seat_id', type: 'uuid' })
  seatId!: string;

  @ManyToOne(() => Seats, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seat_id' })
  seat?: Relation<Seats>;

  @Column({ name: 'holder_user_id', type: 'uuid' })
  holderUserId!: string;

  @Column({ name: 'qr_code', type: 'varchar', length: 255, unique: true })
  qrCode!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'varchar', length: 30 })
  status!: string;

  @Column({ name: 'scanned_by_user_id', type: 'uuid', nullable: true })
  scannedByUserId!: string | null;

  @Column({ name: 'scanned_at', type: 'timestamptz', nullable: true })
  scannedAt!: Date | null;
}

/**
 * Esquema base que representa un registro completo de Ticket en la base de datos
 */
export const ticketSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  functionId: z.string().uuid(),
  seatId: z.string().uuid(),
  holderUserId: z.string().uuid(),
  qrCode: z.string().min(1).max(255),
  price: z.coerce.number().nonnegative(),
  status: z.string().min(1).max(30),
  scannedByUserId: z.string().uuid().nullable(),
  scannedAt: z.date().nullable(),
});

/**
 * Esquema para validar los datos necesarios al crear un nuevo Ticket
 */
export const createTicketSchema = ticketSchema.omit({
  id: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type TicketInput = z.infer<typeof ticketSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
