import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../../domain/entities/movie.entity.js';

@Injectable()
export class MovieRepository {
  constructor(
    @InjectRepository(Movie)
    private readonly repository: Repository<Movie>,
  ) {}

  findDetailById(id: string): Promise<Movie | null> {
    return this.repository.findOne({
      where: { id },
      relations: {
        director: true,
        movieGenres: { genre: true },
        movieActors: { actor: true },
        movieLanguages: { language: true },
        movieFormats: { format: true },
      },
    });
  }

  findActiveById(id: string): Promise<Movie | null> {
    return this.repository.findOne({ where: { id, isActive: true } });
  }

  findActiveWithGenresById(id: string): Promise<Movie | null> {
    return this.repository.findOne({
      where: { id, isActive: true },
      relations: { movieGenres: { genre: true } },
    });
  }

  findActiveWithGenres(): Promise<Movie[]> {
    return this.repository.find({
      where: { isActive: true },
      relations: { movieGenres: { genre: true } },
      order: { title: 'ASC' },
    });
  }
}
