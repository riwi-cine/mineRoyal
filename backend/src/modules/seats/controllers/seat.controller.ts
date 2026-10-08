import { Controller, Get, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Seats } from '../entities/seat.entity.js';
import { SeatDao } from '../dao/seat.dao.js';

/**
 * Controlador de Asientos Físicos (HU-010).
 * Provee acceso directo a la información estructural e individual de una butaca.
 */
@ApiTags('seats')
@Controller('seats')
export class SeatController {
  constructor(private readonly seatDao: SeatDao) {}

  /**
   * Obtiene la información técnica de un asiento por su ID único.
   * @param seatId UUID del asiento.
   * @returns Entidad Seats con fila, número, sala y categoría (STANDARD, VIP, PREFERENTIAL, DISABLED).
   */
  @Get(':seatId')
  @ApiOperation({
    summary: 'Obtiene un asiento por su ID',
    description: 'Devuelve la categoría y ubicación espacial (fila y número) de una butaca en una sala.',
  })
  @ApiParam({ name: 'seatId', description: 'Identificador único del asiento (UUID)', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Asiento encontrado exitosamente.', type: Object })
  @ApiResponse({ status: 400, description: 'El parámetro seatId no tiene formato UUID válido.' })
  @ApiResponse({ status: 404, description: 'Asiento no encontrado.' })
  async getSeatById(@Param('seatId', ParseUUIDPipe) seatId: string): Promise<Seats> {
    const [seat] = await this.seatDao.findSeatsByIds([seatId]);
    if (!seat) {
      throw new NotFoundException('Asiento no encontrado.');
    }
    return seat;
  }
}
