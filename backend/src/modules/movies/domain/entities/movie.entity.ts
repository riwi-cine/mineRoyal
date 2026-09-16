import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { z } from 'zod';

@Entity('movie')
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  title!: string;
  
  @Column({ type: 'varchar', length: 255 })
  synopsis!: string;

  @Column({ type: 'varchar', length: 150 })
  classification!: string;

  @Column({ type: 'int', default: 0 })
  duration!: number;

  @Column({ type: 'varchar', length: 150 })
  director!: string;

  @Column({ type: 'varchar', length: 255 })
  postURL!: string;

  @Column({ type: 'varchar', length: 255 })
  trailerURL!: string;

  @Column({ type: 'varchar', length: 150 })
  status!: string;

}

/**
 * Esquema base que representa un registro completo de Película en la base de datos
 */
export const movieSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(150),
  synopsis: z.string().min(1).max(255),
  classification: z.string().min(1).max(150),
  duration: z.coerce.number().int().nonnegative().default(0),
  director: z.string().min(1).max(150),
  postURL: z.string().url().max(255),
  trailerURL: z.string().url().max(255),
  status: z.string().min(1).max(150),
});

/**
 * Esquema para validar los datos necesarios al crear una nueva Película
 */
export const createMovieSchema = movieSchema.omit({
  id: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type MovieInput = z.infer<typeof movieSchema>;
export type CreateMovieInput = z.infer<typeof createMovieSchema>;