import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Actor } from './actor.entity.js';
import { Movie } from './movie.entity.js';

@Entity('movie_actors')
export class MovieActor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'movie_id', type: 'uuid' })
  movieId!: string;

  @Column({ name: 'actor_id', type: 'uuid' })
  actorId!: string;

  @ManyToOne(() => Movie, (movie) => movie.movieActors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie?: Movie;

  @ManyToOne(() => Actor, (actor) => actor.movieActors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actor_id' })
  actor?: Actor;
}
