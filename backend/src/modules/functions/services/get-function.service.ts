import { Injectable, NotFoundException } from '@nestjs/common';
import { FunctionDao } from '../dao/function.dao.js';
import { FunctionResponseDto } from '../dtos/function-response.dto.js';

/**
 * Servicio encargado de consultar los detalles de una función de cine específica.
 */
@Injectable()
export class GetFunctionService {
  constructor(private readonly functionDao: FunctionDao) {}

  /**
   * Obtiene la información detallada de una función disponible.
   *
   * @param functionId Identificador UUID de la función.
   * @returns Datos formateados de la función en un DTO.
   * @throws NotFoundException Si la función no existe o no está habilitada.
   */
  async execute(functionId: string): Promise<FunctionResponseDto> {
    const cineFunction = await this.functionDao.findSelectableById(functionId);
    if (!cineFunction) {
      throw new NotFoundException('Función no encontrada o ya no está disponible.');
    }
    return new FunctionResponseDto(cineFunction);
  }
}
