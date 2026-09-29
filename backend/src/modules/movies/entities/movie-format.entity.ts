import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Format } from './format.entity.js';
import { Movie } from './movie.entity.js';

const priceTransformer = {
  to: (value?: number): number | undefined => value,
  from: (value?: string): number => (value ? Number.parseFloat(value) : 0),
};

@Entity('movie_formats')
export class MovieFormat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'movie_id', type: 'uuid' })
  movieId!: string;

  @Column({ name: 'format_id', type: 'uuid' })
  formatId!: string;

  @Column({ name: 'price', type: 'numeric', precision: 10, scale: 2, transformer: priceTransformer })
  price!: number;

  @ManyToOne(() => Movie, (movie) => movie.movieFormats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie?: Movie;

  @ManyToOne(() => Format, (format) => format.movieFormats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'format_id' })
  format?: Format;
}
