import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MovieLanguage } from './movie-language.entity.js';

@Entity('languages')
export class Language {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 60, unique: true })
  name!: string;

  @OneToMany(() => MovieLanguage, (movieLanguage) => movieLanguage.language)
  movieLanguages?: MovieLanguage[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
