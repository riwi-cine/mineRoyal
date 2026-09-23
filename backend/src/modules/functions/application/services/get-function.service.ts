import { Injectable, NotFoundException } from '@nestjs/common';
import { FunctionRepository } from '../../infrastructure/dao/function.dao.js';
import { FunctionResponseDto } from '../dtos/function-response.dto.js';

@Injectable()
export class GetFunctionService {
  constructor(private readonly functionRepository: FunctionRepository) {}

  async execute(functionId: string): Promise<FunctionResponseDto> {
    const cineFunction = await this.functionRepository.findSelectableById(functionId);
    if (!cineFunction) {
      throw new NotFoundException('Función no encontrada o ya no está disponible.');
    }
    return new FunctionResponseDto(cineFunction);
  }
}