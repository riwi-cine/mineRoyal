import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cinema } from '../../../locations/domain/entities/cinema.entity.js';
import { Format } from './format.entity.js';
import { Movie } from './movie.entity.js';
import { Room } from './room.entity.js';

const priceTransformer = {
  to: (value?: number): number | undefined => value,
  from: (value?: string): number => (value ? Number.parseFloat(value) : 0),
};

@Entity('movie_functions')
export class MovieFunction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'movie_id', type: 'uuid' })
  movieId!: string;

  @ManyToOne(() => Movie, (movie) => movie.movieFunctions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie?: Movie;

  @Column({ name: 'cinema_id', type: 'uuid' })
  cinemaId!: string;

  @ManyToOne(() => Cinema, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cinema_id' })
  cinema?: Cinema;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId!: string;

  @ManyToOne(() => Room, (room) => room.movieFunctions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room?: Room;

  @Column({ name: 'format_id', type: 'uuid' })
  formatId!: string;

  @ManyToOne(() => Format, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'format_id' })
  format?: Format;

  @Column({ name: 'starts_at', type: 'timestamp' })
  startsAt!: Date;

  @Column({ name: 'ticket_price', type: 'numeric', precision: 10, scale: 2, transformer: priceTransformer })
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
