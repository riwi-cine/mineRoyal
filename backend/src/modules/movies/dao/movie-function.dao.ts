import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { MovieFunction } from '../entities/movie-function.entity.js';

@Injectable()
export class MovieFunctionDao {
  constructor(
    @InjectRepository(MovieFunction)
    private readonly dao: Repository<MovieFunction>,
  ) {}

  findFutureByMovieAndCity(movieId: string, cityId: string): Promise<MovieFunction[]> {
    return this.dao.find({
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
