import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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