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
import { Cinema } from '../../../locations/domain/entities/cinema.entity.js';
import { MovieFunction } from './movie-function.entity.js';

@Entity('cinema_rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'cinema_id', type: 'uuid' })
  cinemaId!: string;

  @ManyToOne(() => Cinema, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cinema_id' })
  cinema?: Relation<Cinema>;

  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Column({ type: 'int' })
  capacity!: number;

  @OneToMany(() => MovieFunction, (movieFunction) => movieFunction.room)
  movieFunctions?: MovieFunction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
