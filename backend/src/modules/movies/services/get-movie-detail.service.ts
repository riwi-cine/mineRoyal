import { Injectable, NotFoundException } from '@nestjs/common';
import { MovieDao } from '../dao/movie.dao.js';
import { MovieDetailResponseDto } from '../dtos/movie-detail-response.dto.js';

@Injectable()
export class GetMovieDetailService {
  constructor(private readonly movieDao: MovieDao) {}

  async execute(movieId: string): Promise<MovieDetailResponseDto> {
    const movie = await this.movieDao.findDetailById(movieId);
    if (!movie || !movie.isActive) {
      throw new NotFoundException('Película no encontrada.');
    }
    return new MovieDetailResponseDto(movie);
  }
}
