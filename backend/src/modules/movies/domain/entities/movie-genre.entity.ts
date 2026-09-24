import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { Genre } from './genre.entity.js';
import { Movie } from './movie.entity.js';

@Entity('movie_genres')
export class MovieGenre {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'movie_id', type: 'uuid' })
  movieId!: string;

  @Column({ name: 'genre_id', type: 'uuid' })
  genreId!: string;

  @ManyToOne(() => Movie, (movie) => movie.movieGenres, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie?: Relation<Movie>;

  @ManyToOne(() => Genre, (genre) => genre.movieGenres, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'genre_id' })
  genre?: Relation<Genre>;
}
