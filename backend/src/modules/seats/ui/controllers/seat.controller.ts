import { Controller, Get, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Seats } from '../../domain/entities/seat.entity.js';
import { SeatRepository } from '../../infrastructure/dao/seat.dao.js';

@ApiTags('seats')
@Controller('seats')
export class SeatController {
  constructor(private readonly seatRepository: SeatRepository) {}

  @Get(':seatId')
  @ApiOperation({ summary: 'Obtiene un asiento por su ID.' })
  @ApiParam({ name: 'seatId', description: 'Identificador del asiento', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Asiento encontrado.', type: Object })
  @ApiResponse({ status: 404, description: 'Asiento no encontrado.' })
  async getSeatById(@Param('seatId', ParseUUIDPipe) seatId: string): Promise<Seats> {
    const [seat] = await this.seatRepository.findSeatsByIds([seatId]);
    if (!seat) {
      throw new NotFoundException('Asiento no encontrado.');
    }
    return seat;
  }
}
