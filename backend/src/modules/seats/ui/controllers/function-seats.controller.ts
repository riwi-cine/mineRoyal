import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SeatService } from '../../application/services/seat.service.js';
import { SeatMap } from '../../application/dtos/seat-map.dto.js';

/**
 * Exposes the room's seat map for a given function (HU-010).
 * Kept under `functions/:functionId/seats` rather than `seats/` because the
 * map is always scoped to one function's room/availability, not to seats in general.
 */
@ApiTags('seats')
@Controller('functions')
export class FunctionSeatsController {
  constructor(private readonly seatService: SeatService) {}

  @Get(':functionId/seats')
  @ApiOperation({ summary: 'Obtiene el mapa de sillas de una función con su disponibilidad en tiempo real.' })
  @ApiParam({ name: 'functionId', description: 'Identificador de la función', format: 'uuid' })
  @ApiQuery({
    name: 'cartId',
    required: false,
    type: String,
    description:
      'Carrito que realiza la consulta, usado para distinguir sus propias sillas (SELECTED) de las de otros usuarios (LOCKED).',
  })
  @ApiResponse({ status: 200, description: 'Mapa de sillas de la sala.' })
  @ApiResponse({ status: 404, description: 'Función no encontrada.' })
  getSeatMap(
    @Param('functionId', ParseUUIDPipe) functionId: string,
    @Query('cartId', new ParseUUIDPipe({ optional: true })) cartId?: string,
  ): Promise<SeatMap> {
    return this.seatService.getSeatMap(functionId, cartId);
  }
}
