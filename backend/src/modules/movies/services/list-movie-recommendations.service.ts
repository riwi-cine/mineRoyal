import { Injectable, NotFoundException } from '@nestjs/common';
import { MovieDao } from '../dao/movie.dao.js';
import { MovieSummaryResponseDto } from '../dtos/movie-summary-response.dto.js';

@Injectable()
export class ListMovieRecommendationsService {
  private static readonly MAX_RECOMMENDATIONS = 5;

  constructor(private readonly movieDao: MovieDao) {}

  async execute(movieId: string): Promise<MovieSummaryResponseDto[]> {
    const movie = await this.movieDao.findActiveWithGenresById(movieId);
    if (!movie) {
      throw new NotFoundException('Película no encontrada.');
    }

    const targetGenreIds = new Set((movie.movieGenres ?? []).map((mg) => mg.genreId));
    if (targetGenreIds.size === 0) {
      return [];
    }

    const allMovies = await this.movieDao.findActiveWithGenres();

    const scored = allMovies
      .filter((m) => m.id !== movieId)
      .map((m) => ({
        movie: m,
        overlap: (m.movieGenres ?? []).filter((mg) => targetGenreIds.has(mg.genreId)).length,
      }))
      .filter((entry) => entry.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap || a.movie.title.localeCompare(b.movie.title));

    return scored
      .slice(0, ListMovieRecommendationsService.MAX_RECOMMENDATIONS)
      .map((entry) => new MovieSummaryResponseDto(entry.movie));
  }
}
