import { Injectable, NotFoundException } from '@nestjs/common';
import { MovieRepository } from '../../infrastructure/dao/movie.repository.js';
import { MovieDetailResponseDto } from '../dtos/movie-detail-response.dto.js';

@Injectable()
export class GetMovieDetailUseCase {
  constructor(private readonly movieRepository: MovieRepository) {}

  async execute(movieId: string): Promise<MovieDetailResponseDto> {
    const movie = await this.movieRepository.findDetailById(movieId);
    if (!movie || !movie.isActive) {
      throw new NotFoundException('Película no encontrada.');
    }
    return new MovieDetailResponseDto(movie);
  }
}
