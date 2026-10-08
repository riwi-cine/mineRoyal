import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { numericPriceTransformer } from '../../../shared/infrastructure/database/transformers/numeric.transformer.js';
import { Format } from './format.entity.js';
import type { Movie } from './movie.entity.js';

@Entity('movie_formats')
export class MovieFormat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'movie_id', type: 'uuid' })
  movieId!: string;

  @Column({ name: 'format_id', type: 'uuid' })
  formatId!: string;

  @Column({ name: 'price', type: 'numeric', precision: 10, scale: 2, transformer: numericPriceTransformer })
  price!: number;

  @ManyToOne('Movie', (movie: Movie) => movie.movieFormats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie?: Relation<Movie>;

  @ManyToOne(() => Format, (format) => format.movieFormats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'format_id' })
  format?: Relation<Format>;
}
