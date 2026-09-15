import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Room } from './room.entity.js';

@Entity('seats')
export class Seats {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId!: string;

  @ManyToOne(() => Room, (room) => room.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room?: Room;

  @Column({ type: 'varchar', length: 5 })
  row!: string;

  @Column({ type: 'varchar', length: 5 })
  number!: string;

  @Column({ name: 'seat_type', type: 'varchar', length: 30 })
  seatType!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
