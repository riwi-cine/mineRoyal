import { Injectable, NotFoundException } from '@nestjs/common';
import { MovieDao } from '../dao/movie.dao.js';
import { MovieDetailResponseDto } from '../dtos/movie-detail-response.dto.js';

/**
 * Servicio para consultar el detalle completo de una película en cartelera.
 */
@Injectable()
export class GetMovieDetailService {
  constructor(private readonly movieDao: MovieDao) {}

  /**
   * Obtiene la sinopsis, actores, directores, géneros y formatos asociados a una película.
   *
   * @param movieId Identificador UUID de la película.
   * @returns Datos consolidados de la película en un DTO de respuesta.
   * @throws NotFoundException Si la película no existe o no se encuentra activa en el catálogo.
   */
  async execute(movieId: string): Promise<MovieDetailResponseDto> {
    const movie = await this.movieDao.findDetailById(movieId);
    if (!movie || !movie.isActive) {
      throw new NotFoundException('Película no encontrada.');
    }
    return new MovieDetailResponseDto(movie);
  }
}
