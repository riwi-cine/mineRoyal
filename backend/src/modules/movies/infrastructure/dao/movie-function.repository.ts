import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { MovieFunction } from '../../domain/entities/movie-function.entity.js';

@Injectable()
export class MovieFunctionRepository {
  constructor(
    @InjectRepository(MovieFunction)
    private readonly repository: Repository<MovieFunction>,
  ) {}

  findFutureByMovieAndCity(movieId: string, cityId: string): Promise<MovieFunction[]> {
    return this.repository.find({
      where: {
        movieId,
        isActive: true,
        startsAt: MoreThan(new Date()),
        cinema: { cityId },
      },
      relations: {
        cinema: { city: true },
        room: true,
        format: true,
      },
      order: { startsAt: 'ASC' },
    });
  }
}
