import { Body, Controller, Delete, Get, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SeatService } from '../../seats/services/seat.service.js';
import {
  LockSeatsDto,
  LockSeatsResult,
  ReleaseSeatsDto,
  ReleaseSeatsResult,
  ReservationSummary,
} from '../../seats/dtos/seat-map.dto.js';

/**
 * Controlador de reservas de sillas para funciones de cine (HU-010).
 *
 * Provee los endpoints para el ciclo de vida del bloqueo temporal de asientos
 * durante el proceso de compra de boletos, su liberación y el cálculo del
 * resumen tarifario asociado al carrito.
 */
@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly seatService: SeatService) {}

  /**
   * Bloquea temporalmente un conjunto de sillas para un carrito de compras.
   *
   * Cumple con las reglas de negocio RN-039 (bloqueo por 10 minutos),
   * RN-041 (control de concurrencia y rechazo de sillas ocupadas) y RN-043
   * (límite máximo de sillas por reserva).
   *
   * @param dto Datos del bloqueo con identificador de función, carrito y lista de IDs de sillas.
   * @returns Objeto con las sillas exitosamente bloqueadas, las rechazadas y la fecha de expiración.
   * @throws BadRequestException Si la lista de sillas está vacía, excede el límite máximo o incluye sillas ajenas a la sala.
   * @throws NotFoundException Si la función solicitada no existe.
   */
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

  /**
   * Libera las sillas bloqueadas por un carrito de compras.
   *
   * Aplica la regla RN-040 permitiendo la liberación total o parcial de los
   * bloqueos de asientos asignados al carrito especificado.
   *
   * @param dto Identificadores de función, carrito y opcionalmente lista de IDs específicos de sillas a liberar.
   * @returns Objeto con el contador de sillas liberadas.
   */
  @Delete('release-seats')
  @ApiOperation({ summary: 'Libera sillas bloqueadas por un carrito (RN-040), total o parcialmente.' })
  @ApiBody({ type: ReleaseSeatsDto })
  @ApiResponse({ status: 200, description: 'Cantidad de sillas liberadas.' })
  @ApiResponse({ status: 400, description: 'Cuerpo de la petición inválido o UUIDs malformados.' })
  releaseSeats(@Body() dto: ReleaseSeatsDto): Promise<ReleaseSeatsResult> {
    return this.seatService.releaseSeats(dto);
  }

  /**
   * Obtiene el resumen económico de las sillas bloqueadas por un carrito en una función.
   *
   * Calcula el desglose detallado por fila y columna, el precio unitario según
   * el tipo de asiento y formato, y el subtotal acumulado.
   *
   * @param functionId Identificador UUID de la función.
   * @param cartId Identificador UUID del carrito de compras.
   * @returns Desglose de asientos seleccionados y subtotal económico de la reserva.
   * @throws BadRequestException Si alguno de los identificadores no es un UUID válido.
   * @throws NotFoundException Si la función no existe.
   */
  @Get('summary')
  @ApiOperation({ summary: 'Resumen económico de las sillas actualmente bloqueadas por un carrito para una función.' })
  @ApiQuery({ name: 'functionId', description: 'Identificador UUID de la función', type: String })
  @ApiQuery({ name: 'cartId', description: 'Identificador UUID del carrito', type: String })
  @ApiResponse({ status: 200, description: 'Resumen de la reserva (sillas, precio unitario y total).' })
  @ApiResponse({ status: 400, description: 'Identificador de función o carrito con formato UUID inválido.' })
  @ApiResponse({ status: 404, description: 'Función no encontrada.' })
  getSummary(
    @Query('functionId', ParseUUIDPipe) functionId: string,
    @Query('cartId', ParseUUIDPipe) cartId: string,
  ): Promise<ReservationSummary> {
    return this.seatService.getReservationSummary(functionId, cartId);
  }
}
