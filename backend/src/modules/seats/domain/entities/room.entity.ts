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
  cinema?: Relation<Cinema>;

  @Column({ name: 'room_type_id', type: 'uuid' })
  roomTypeId!: string;

  @ManyToOne(() => RoomType, (roomType) => roomType.rooms, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'room_type_id' })
  roomType?: Relation<RoomType>;

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

/**
 * Esquema base que representa un registro completo de Sala en la base de datos
 */
export const roomSchema = z.object({
  id: z.string().uuid(),
  cinemaId: z.string().uuid(),
  roomTypeId: z.string().uuid(),
  name: z.string().min(1).max(50),
  capacity: z.coerce.number().int().positive(),
  extraPrice: z.coerce.number().nonnegative().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Esquema para validar los datos necesarios al crear una nueva Sala
 */
export const createRoomSchema = roomSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type RoomInput = z.infer<typeof roomSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
