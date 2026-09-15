import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Room } from '../../../seats/domain/entities/room.entity.js';
import { FunctionType } from './function-type.entity.js';

@Entity('functions')
export class Function {
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
