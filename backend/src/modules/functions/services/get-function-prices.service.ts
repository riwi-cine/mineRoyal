import { Injectable, NotFoundException } from '@nestjs/common';
import { FunctionDao } from '../dao/function.dao.js';
import { FunctionPriceResponseDto } from '../dtos/function-price.dto.js';

@Injectable()
export class GetFunctionPricesService {
  constructor(private readonly functionDao: FunctionDao) {}

  async execute(functionId: string): Promise<FunctionPriceResponseDto> {
    const cineFunction = await this.functionDao.findSelectableById(functionId);
    if (!cineFunction) {
      throw new NotFoundException('Función no encontrada o ya no está disponible.');
    }
    return new FunctionPriceResponseDto(cineFunction);
  }
}
