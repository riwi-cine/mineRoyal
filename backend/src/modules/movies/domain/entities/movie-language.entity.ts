import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { Language } from './language.entity.js';
import { Movie } from './movie.entity.js';

@Entity('movie_languages')
export class MovieLanguage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'movie_id', type: 'uuid' })
  movieId!: string;

  @Column({ name: 'language_id', type: 'uuid' })
  languageId!: string;

  @ManyToOne(() => Movie, (movie) => movie.movieLanguages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie?: Relation<Movie>;

  @ManyToOne(() => Language, (language) => language.movieLanguages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'language_id' })
  language?: Relation<Language>;
}
