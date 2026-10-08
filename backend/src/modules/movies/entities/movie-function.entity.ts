import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Cinema } from '../../locations/entities/cinema.entity.js';
import { Format } from './format.entity.js';
import type { Movie } from './movie.entity.js';
import { Room } from './room.entity.js';
import { numericPriceTransformer } from '../../../shared/infrastructure/database/transformers/numeric.transformer.js';

@Entity('movie_functions')
export class MovieFunction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'movie_id', type: 'uuid' })
  movieId!: string;

  @ManyToOne('Movie', (movie: Movie) => movie.movieFunctions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie?: Relation<Movie>;

  @Column({ name: 'cinema_id', type: 'uuid' })
  cinemaId!: string;

  @ManyToOne(() => Cinema, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cinema_id' })
  cinema?: Relation<Cinema>;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId!: string;

  @ManyToOne(() => Room, (room) => room.movieFunctions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room?: Relation<Room>;

  @Column({ name: 'format_id', type: 'uuid' })
  formatId!: string;

  @ManyToOne(() => Format, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'format_id' })
  format?: Relation<Format>;

  @Column({ name: 'starts_at', type: 'timestamp' })
  startsAt!: Date;

  @Column({ name: 'ticket_price', type: 'numeric', precision: 10, scale: 2, transformer: numericPriceTransformer })
  ticketPrice!: number;

  @Column({ name: 'total_seats', type: 'int' })
  totalSeats!: number;

  @Column({ name: 'available_seats', type: 'int' })
  availableSeats!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
