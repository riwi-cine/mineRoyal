import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SeatMap } from '../dtos/seat-map.dto.js';
import { SeatService } from '../services/seat.service.js';

/**
 * Controlador de Asignación y Disponibilidad de Asientos por Función (HU-010).
 * Genera el plano interactivo de la sala en tiempo real diferenciando estados:
 * AVAILABLE, LOCKED (bloqueado por otro usuario), SELECTED (bloqueado por el carrito actual) y SOLD.
 */
@ApiTags('seats')
@Controller('functions')
export class FunctionSeatsController {
  constructor(private readonly seatService: SeatService) {}

  /**
   * Obtiene el mapa de butacas de una función con su disponibilidad en tiempo real.
   * @param functionId UUID de la función de cine.
   * @param cartId UUID opcional del carrito del usuario para identificar sus sillas en estado SELECTED.
   * @returns Mapa de la sala con filas, distribución y estado de ocupación de cada asiento.
   */
  @Get(':functionId/seats')
  @ApiOperation({
    summary: 'Obtiene el mapa de sillas de una función en tiempo real',
    description:
      'Devuelve la topología de la sala calculando la disponibilidad dinámica contra bloqueos activos y tickets vendidos.',
  })
  @ApiParam({ name: 'functionId', description: 'Identificador único de la función (UUID)', format: 'uuid' })
  @ApiQuery({
    name: 'cartId',
    required: false,
    type: String,
    description: 'UUID del carrito para identificar sus propias butacas bloqueadas como SELECTED.',
  })
  @ApiResponse({ status: 200, description: 'Mapa interactivo de sillas de la sala generado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Identificador functionId o cartId no tienen formato UUID válido.' })
  @ApiResponse({ status: 404, description: 'Función no encontrada o ya finalizada.' })
  getSeatMap(
    @Param('functionId', ParseUUIDPipe) functionId: string,
    @Query('cartId', new ParseUUIDPipe({ optional: true })) cartId?: string,
  ): Promise<SeatMap> {
    return this.seatService.getSeatMap(functionId, cartId);
  }
}
