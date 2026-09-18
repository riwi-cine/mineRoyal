import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { z } from 'zod';
import { Room } from './room.entity.js';

@Entity('room_types')
export class RoomType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @OneToMany(() => Room, (room) => room.roomType)
  rooms?: Room[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

/**
 * Esquema base que representa un registro completo de Tipo de Sala en la base de datos
 */
export const roomTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  description: z.string().min(1).max(255),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Esquema para validar los datos necesarios al crear un nuevo Tipo de Sala
 */
export const createRoomTypeSchema = roomTypeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type RoomTypeInput = z.infer<typeof roomTypeSchema>;
export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>;
