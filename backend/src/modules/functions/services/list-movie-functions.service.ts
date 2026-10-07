import { Injectable, NotFoundException } from '@nestjs/common';
import { FunctionFilters, FunctionDao } from '../dao/function.dao.js';
import { FunctionResponseDto } from '../dtos/function-response.dto.js';

@Injectable()
export class ListMovieFunctionsService {
  constructor(private readonly functionDao: FunctionDao) {}

  async execute(movieId: string, filters: FunctionFilters): Promise<FunctionResponseDto[]> {
    const movie = await this.functionDao.findMovieById(movieId);
    if (!movie) {
      throw new NotFoundException('Película no encontrada.');
    }

    const functions = await this.functionDao.findActiveFunctionsByMovie(movieId, filters);
    return functions.map((cineFunction) => new FunctionResponseDto(cineFunction));
  }
}
