import { Injectable, NotFoundException } from '@nestjs/common';
import { FunctionDao } from '../dao/function.dao.js';
import { FunctionPriceResponseDto } from '../dtos/function-price.dto.js';

/**
 * Servicio encargado de calcular y retornar el desglose tarifario de precios para una función de cine.
 */
@Injectable()
export class GetFunctionPricesService {
  constructor(private readonly functionDao: FunctionDao) {}

  /**
   * Obtiene la estructura tarifaria (precio base y sobrecostos por sala o formato) para una función.
   *
   * @param functionId Identificador UUID de la función.
   * @returns Desglose tarifario de la función en un DTO.
   * @throws NotFoundException Si la función no existe o no se encuentra disponible.
   */
  async execute(functionId: string): Promise<FunctionPriceResponseDto> {
    const cineFunction = await this.functionDao.findSelectableById(functionId);
    if (!cineFunction) {
      throw new NotFoundException('Función no encontrada o ya no está disponible.');
    }
    return new FunctionPriceResponseDto(cineFunction);
  }
}
