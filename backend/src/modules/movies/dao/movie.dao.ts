import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../entities/movie.entity.js';

@Injectable()
export class MovieDao {
  constructor(
    @InjectRepository(Movie)
    private readonly dao: Repository<Movie>,
  ) {}

  findDetailById(id: string): Promise<Movie | null> {
    return this.dao.findOne({
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
    return this.dao.findOne({ where: { id, isActive: true } });
  }

  findActiveWithGenresById(id: string): Promise<Movie | null> {
    return this.dao.findOne({
      where: { id, isActive: true },
      relations: { movieGenres: { genre: true } },
    });
  }

  findActiveWithGenres(): Promise<Movie[]> {
    return this.dao.find({
      where: { isActive: true },
      relations: { movieGenres: { genre: true } },
      order: { title: 'ASC' },
    });
  }
}
