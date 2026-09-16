import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  async getSeatById(@Param('seatId', ParseUUIDPipe) seatId: string): Promise<any> {
    const seat = await this.seatRepository.findSeatsByIds([seatId]).then((seats) => seats[0]);
    if (!seat) {
      throw new Error('Asiento no encontrado');
    }
    return seat;
  }
}
