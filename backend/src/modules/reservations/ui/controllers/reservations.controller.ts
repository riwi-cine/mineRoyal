import { Body, Controller, Delete, Get, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SeatService } from '../../../seats/application/services/seat.service.js';
import {
  LockSeatsDto,
  LockSeatsResult,
  ReleaseSeatsDto,
  ReleaseSeatsResult,
  ReservationSummary,
} from '../../../seats/application/dtos/seat-map.dto.js';

/**
 * Reservation flow of HU-010: temporarily locking seats while the user
 * completes a purchase, releasing them, and summarizing the selection.
 */
@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly seatService: SeatService) {}

  @Post('lock-seats')
  @ApiOperation({
    summary: 'Bloquea temporalmente (10 min) un conjunto de sillas para un carrito (RN-039, RN-041, RN-043).',
  })
  @ApiBody({ type: LockSeatsDto })
  @ApiResponse({ status: 201, description: 'Resultado del bloqueo: sillas bloqueadas y sillas rechazadas.' })
  @ApiResponse({ status: 400, description: 'Selección inválida (vacía, excede el máximo o sillas fuera de la sala).' })
  @ApiResponse({ status: 404, description: 'Función no encontrada.' })
  lockSeats(@Body() dto: LockSeatsDto): Promise<LockSeatsResult> {
    return this.seatService.lockSeats(dto);
  }

  @Delete('release-seats')
  @ApiOperation({ summary: 'Libera sillas bloqueadas por un carrito (RN-040), total o parcialmente.' })
  @ApiBody({ type: ReleaseSeatsDto })
  @ApiResponse({ status: 200, description: 'Cantidad de sillas liberadas.' })
  releaseSeats(@Body() dto: ReleaseSeatsDto): Promise<ReleaseSeatsResult> {
    return this.seatService.releaseSeats(dto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumen económico de las sillas actualmente bloqueadas por un carrito para una función.' })
  @ApiQuery({ name: 'functionId', description: 'Identificador de la función', type: String })
  @ApiQuery({ name: 'cartId', description: 'Identificador del carrito', type: String })
  @ApiResponse({ status: 200, description: 'Resumen de la reserva (sillas, precio unitario y total).' })
  @ApiResponse({ status: 404, description: 'Función no encontrada.' })
  getSummary(
    @Query('functionId', ParseUUIDPipe) functionId: string,
    @Query('cartId', ParseUUIDPipe) cartId: string,
  ): Promise<ReservationSummary> {
    return this.seatService.getReservationSummary(functionId, cartId);
  }
}
