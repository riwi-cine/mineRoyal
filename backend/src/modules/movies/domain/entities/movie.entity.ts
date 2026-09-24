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
import { Director } from './director.entity.js';
import { MovieActor } from './movie-actor.entity.js';
import { MovieFormat } from './movie-format.entity.js';
import { MovieFunction } from './movie-function.entity.js';
import { MovieGenre } from './movie-genre.entity.js';
import { MovieLanguage } from './movie-language.entity.js';

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ name: 'poster_url', type: 'varchar', length: 500, nullable: true })
  posterUrl?: string;

  @Column({ name: 'banner_url', type: 'varchar', length: 500, nullable: true })
  bannerUrl?: string;

  @Column({ name: 'trailer_url', type: 'varchar', length: 500, nullable: true })
  trailerUrl?: string;

  @Column({ type: 'text' })
  synopsis!: string;

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes!: number;

  @Column({ type: 'varchar', length: 10 })
  classification!: string;

  @Column({ name: 'release_date', type: 'date' })
  releaseDate!: Date;

  @Column({ type: 'float', precision: 3, scale: 1, default: 0 })
  rating!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'director_id', type: 'uuid' })
  directorId!: string;

  @ManyToOne(() => Director, (director) => director.movies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'director_id' })
  director?: Relation<Director>;

  @OneToMany(() => MovieGenre, (movieGenre) => movieGenre.movie)
  movieGenres?: MovieGenre[];

  @OneToMany(() => MovieActor, (movieActor) => movieActor.movie)
  movieActors?: MovieActor[];

  @OneToMany(() => MovieLanguage, (movieLanguage) => movieLanguage.movie)
  movieLanguages?: MovieLanguage[];

  @OneToMany(() => MovieFormat, (movieFormat) => movieFormat.movie)
  movieFormats?: MovieFormat[];

  @OneToMany(() => MovieFunction, (movieFunction) => movieFunction.movie)
  movieFunctions?: MovieFunction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export const movieSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  posterUrl: z.string().url().max(500).optional(),
  bannerUrl: z.string().url().max(500).optional(),
  trailerUrl: z.string().url().max(500).optional(),
  synopsis: z.string().min(1),
  durationMinutes: z.coerce.number().int().nonnegative(),
  classification: z.string().min(1).max(10),
  releaseDate: z.coerce.date(),
  rating: z.coerce.number().min(0).max(10).default(0),
  isActive: z.boolean().default(true),
  directorId: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createMovieSchema = movieSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type MovieInput = z.infer<typeof movieSchema>;
export type CreateMovieInput = z.infer<typeof createMovieSchema>;
