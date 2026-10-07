import { Injectable, NotFoundException } from '@nestjs/common';
import { FunctionDao } from '../dao/function.dao.js';
import { FunctionResponseDto } from '../dtos/function-response.dto.js';

@Injectable()
export class GetFunctionService {
  constructor(private readonly functionDao: FunctionDao) {}

  async execute(functionId: string): Promise<FunctionResponseDto> {
    const cineFunction = await this.functionDao.findSelectableById(functionId);
    if (!cineFunction) {
      throw new NotFoundException('Función no encontrada o ya no está disponible.');
    }
    return new FunctionResponseDto(cineFunction);
  }
}
