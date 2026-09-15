import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
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
