import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { z } from 'zod';
import { MovieGenre } from './movie-genre.entity.js';

@Entity('genres')
export class Genre {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 60, unique: true })
  name!: string;

  @OneToMany(() => MovieGenre, (movieGenre) => movieGenre.genre)
  movieGenres?: MovieGenre[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export const genreSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(60),
});

export const createGenreSchema = genreSchema.omit({
  id: true,
});

export type GenreInput = z.infer<typeof genreSchema>;
export type CreateGenreInput = z.infer<typeof createGenreSchema>;
