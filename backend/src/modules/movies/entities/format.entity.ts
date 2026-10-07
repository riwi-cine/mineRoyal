import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MovieFormat } from './movie-format.entity.js';

@Entity('formats')
export class Format {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  name!: string;

  @OneToMany(() => MovieFormat, (movieFormat) => movieFormat.format)
  movieFormats?: MovieFormat[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
