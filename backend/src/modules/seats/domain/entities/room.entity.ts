import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cinema } from '../../../locations/domain/entities/cinema.entity.js';
import { RoomType } from './room-type.entity.js';
import { Seats } from './seat.entity.js';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'cinema_id', type: 'uuid' })
  cinemaId!: string;

  @ManyToOne(() => Cinema, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cinema_id' })
  cinema?: Cinema;

  @Column({ name: 'room_type_id', type: 'uuid' })
  roomTypeId!: string;

  @ManyToOne(() => RoomType, (roomType) => roomType.rooms, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'room_type_id' })
  roomType?: RoomType;

  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @Column({ type: 'int' })
  capacity!: number;

  @Column({ name: 'extra_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  extraPrice!: number;

  @OneToMany(() => Seats, (seat) => seat.room)
  seats?: Seats[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
