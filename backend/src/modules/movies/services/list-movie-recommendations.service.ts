import { Injectable, NotFoundException } from '@nestjs/common';
import { MovieDao } from '../dao/movie.dao.js';
import { MovieSummaryResponseDto } from '../dtos/movie-summary-response.dto.js';

/**
 * Servicio encargado de generar recomendaciones de películas similares basadas en coincidencia de géneros.
 */
@Injectable()
export class ListMovieRecommendationsService {
  private static readonly MAX_RECOMMENDATIONS = 5;

  constructor(private readonly movieDao: MovieDao) {}

  /**
   * Calcula hasta 5 películas afines a la indicada según el mayor traslape de géneros cinematográficos.
   *
   * @param movieId Identificador UUID de la película de referencia.
   * @returns Lista de películas recomendadas ordenadas por afinidad.
   * @throws NotFoundException Si la película de referencia no existe.
   */
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
