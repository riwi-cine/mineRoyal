import { Injectable, NotFoundException } from '@nestjs/common';
import { UserLocationRepository } from '../../../users/infrastructure/dao/user-location.repository.js';
import { MovieFunctionRepository } from '../../infrastructure/dao/movie-function.repository.js';
import { MovieRepository } from '../../infrastructure/dao/movie.repository.js';
import { MovieFunctionResponseDto } from '../dtos/movie-function-response.dto.js';

@Injectable()
export class ListMovieFunctionsUseCase {
  constructor(
    private readonly movieRepository: MovieRepository,
    private readonly movieFunctionRepository: MovieFunctionRepository,
    private readonly userLocationRepository: UserLocationRepository,
  ) {}

  async execute(
    movieId: string,
    userId: string,
  ): Promise<{ movieId: string; cityId: string | null; functions: MovieFunctionResponseDto[]; message?: string }> {
    const movie = await this.movieRepository.findActiveById(movieId);
    if (!movie) {
      throw new NotFoundException('Película no encontrada.');
    }

    const userLocation = await this.userLocationRepository.findByUserId(userId);
    if (!userLocation) {
      return { movieId, cityId: null, functions: [], message: 'No se encontró ubicación para el usuario.' };
    }

    const functions = await this.movieFunctionRepository.findFutureByMovieAndCity(movieId, userLocation.cityId);

    return {
      movieId,
      cityId: userLocation.cityId,
      functions: functions.map((fn) => new MovieFunctionResponseDto(fn)),
      ...(functions.length === 0 ? { message: 'No hay funciones futuras disponibles para esta película.' } : {}),
    };
  }
}
