import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { z } from 'zod';

@Entity('genres')
export class Genre {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name!: string;
}

/**
 * Esquema base que representa un registro completo de Género en la base de datos
 */
export const genreSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
});

/**
 * Esquema para validar los datos necesarios al crear un nuevo Género
 */
export const createGenreSchema = genreSchema.omit({
  id: true,
});

// Tipos inferidos a partir de los esquemas de Zod
export type GenreInput = z.infer<typeof genreSchema>;
export type CreateGenreInput = z.infer<typeof createGenreSchema>;
