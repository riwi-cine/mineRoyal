import { Injectable, NotFoundException } from '@nestjs/common';
import { UserLocationDao } from '../../users/dao/user-location.dao.js';
import { MovieFunctionDao } from '../dao/movie-function.dao.js';
import { MovieDao } from '../dao/movie.dao.js';
import { MovieFunctionResponseDto } from '../dtos/movie-function-response.dto.js';

@Injectable()
export class ListMovieFunctionsService {
  constructor(
    private readonly movieDao: MovieDao,
    private readonly movieFunctionDao: MovieFunctionDao,
    private readonly userLocationDao: UserLocationDao,
  ) {}

  async execute(
    movieId: string,
    userId: number,
  ): Promise<{ movieId: string; cityId: string | null; functions: MovieFunctionResponseDto[]; message?: string }> {
    const movie = await this.movieDao.findActiveById(movieId);
    if (!movie) {
      throw new NotFoundException('Película no encontrada.');
    }

    const userLocation = await this.userLocationDao.findByUserId(userId);
    if (!userLocation) {
      return { movieId, cityId: null, functions: [], message: 'No se encontró ubicación para el usuario.' };
    }

    const functions = await this.movieFunctionDao.findFutureByMovieAndCity(movieId, userLocation.cityId);

    return {
      movieId,
      cityId: userLocation.cityId,
      functions: functions.map((fn) => new MovieFunctionResponseDto(fn)),
      ...(functions.length === 0 ? { message: 'No hay funciones futuras disponibles para esta película.' } : {}),
    };
  }
}
