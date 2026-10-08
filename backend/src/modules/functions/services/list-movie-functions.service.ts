import { Injectable, NotFoundException } from '@nestjs/common';
import { FunctionFilters, FunctionDao } from '../dao/function.dao.js';
import { FunctionResponseDto } from '../dtos/function-response.dto.js';

/**
 * Servicio encargado de filtrar y listar las funciones disponibles para una película específica.
 */
@Injectable()
export class FilterFunctionsService {
  constructor(private readonly functionDao: FunctionDao) {}

  /**
   * Consulta las funciones activas de una película aplicando filtros opcionales de fecha, ciudad o formato.
   *
   * @param movieId Identificador UUID de la película.
   * @param filters Criterios de filtrado (fecha, ciudad, cine).
   * @returns Lista de funciones coincidentes formateadas en DTOs.
   * @throws NotFoundException Si la película no existe en el catálogo.
   */
  async execute(movieId: string, filters: FunctionFilters): Promise<FunctionResponseDto[]> {
    const movie = await this.functionDao.findMovieById(movieId);
    if (!movie) {
      throw new NotFoundException('Película no encontrada.');
    }

    const functions = await this.functionDao.findActiveFunctionsByMovie(movieId, filters);
    return functions.map((cineFunction) => new FunctionResponseDto(cineFunction));
  }
}

export { FilterFunctionsService as ListMovieFunctionsService };
