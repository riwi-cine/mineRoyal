import { Injectable, NotFoundException } from '@nestjs/common';
import { FunctionFilters, FunctionRepository } from '../../infrastructure/dao/function.dao.js';
import { FunctionResponseDto } from '../dtos/function-response.dto.js';

@Injectable()
export class ListMovieFunctionsUseCase {
  constructor(private readonly functionRepository: FunctionRepository) {}

  async execute(movieId: string, filters: FunctionFilters): Promise<FunctionResponseDto[]> {
    const movie = await this.functionRepository.findMovieById(movieId);
    if (!movie) {
      throw new NotFoundException('Película no encontrada.');
    }

    const functions = await this.functionRepository.findActiveFunctionsByMovie(movieId, filters);
    return functions.map((cineFunction) => new FunctionResponseDto(cineFunction));
  }
}
