import { Injectable, NotFoundException } from '@nestjs/common';
import { FunctionRepository } from '../../infrastructure/dao/function.dao.js';
import { FunctionPriceResponseDto } from '../dtos/function-price.dto.js';

@Injectable()
export class GetFunctionPricesUseCase {
  constructor(private readonly functionRepository: FunctionRepository) {}

  async execute(functionId: string): Promise<FunctionPriceResponseDto> {
    const cineFunction = await this.functionRepository.findSelectableById(functionId);
    if (!cineFunction) {
      throw new NotFoundException('Función no encontrada o ya no está disponible.');
    }
    return new FunctionPriceResponseDto(cineFunction);
  }
}
