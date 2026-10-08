import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FunctionPriceResponseDto } from '../dtos/function-price.dto.js';
import { FunctionResponseDto } from '../dtos/function-response.dto.js';
import { GetFunctionPricesService } from '../services/get-function-prices.service.js';
import { GetFunctionService } from '../services/get-function.service.js';
import { FilterFunctionsService } from '../services/list-movie-functions.service.js';

/**
 * Controlador de Funciones y Formatos de Proyección (HU-009).
 * Permite buscar funciones activas y futuras de una película mediante filtros multidimensionales
 * (fecha, cine, sala, formato 2D/3D/IMAX e idioma) y consultar la tarifa detallada por función.
 */
@ApiTags('functions')
@Controller()
export class FunctionsController {
  constructor(
    private readonly filterFunctionsService: FilterFunctionsService,
    private readonly getFunctionService: GetFunctionService,
    private readonly getFunctionPricesService: GetFunctionPricesService,
  ) {}

  /**
   * Lista las funciones activas y aún no iniciadas de una película con filtros opcionales.
   * @param movieId UUID de la película a consultar.
   * @param date Filtro de fecha en formato ISO (YYYY-MM-DD).
   * @param cinemaId Filtro opcional por UUID de cine.
   * @param roomId Filtro opcional por UUID de sala.
   * @param format Filtro por formato de proyección (2D, 3D, IMAX).
   * @param language Filtro por idioma (ES, EN).
   * @param audioType Tipo de audio: 'DOBLADA' o 'SUBTITULADA'.
   * @returns Listado de funciones que cumplen con los filtros indicados.
   */
  @Get('movies/:movieId/functions')
  @ApiOperation({
    summary: 'Lista las funciones activas y no iniciadas de una película',
    description: 'Aplica reglas de negocio RN-035 (starts_at > now) y RN-036 (active = true) con filtros combinados.',
  })
  @ApiParam({ name: 'movieId', description: 'Identificador único de la película (UUID)', format: 'uuid' })
  @ApiQuery({
    name: 'date',
    required: false,
    example: '2026-10-15',
    description: 'Filtra por fecha en formato YYYY-MM-DD.',
  })
  @ApiQuery({
    name: 'cinemaId',
    required: false,
    type: String,
    description: 'Filtra por identificador de cine (UUID).',
  })
  @ApiQuery({ name: 'roomId', required: false, type: String, description: 'Filtra por identificador de sala (UUID).' })
  @ApiQuery({
    name: 'format',
    required: false,
    example: 'IMAX',
    description: 'Filtra por formato de proyección (2D, 3D, IMAX).',
  })
  @ApiQuery({ name: 'language', required: false, example: 'ES', description: 'Filtra por idioma de la película.' })
  @ApiQuery({
    name: 'audioType',
    required: false,
    enum: ['DOBLADA', 'SUBTITULADA'],
    description: 'Modalidad de audio.',
  })
  @ApiResponse({ status: 200, description: 'Listado de funciones disponibles.', type: [FunctionResponseDto] })
  @ApiResponse({ status: 400, description: 'Identificador de película o parámetros con formato UUID inválido.' })
  @ApiResponse({ status: 404, description: 'Película no encontrada en cartelera.' })
  listMovieFunctions(
    @Param('movieId', ParseUUIDPipe) movieId: string,
    @Query('date') date?: string,
    @Query('cinemaId', new ParseUUIDPipe({ optional: true })) cinemaId?: string,
    @Query('roomId', new ParseUUIDPipe({ optional: true })) roomId?: string,
    @Query('format') format?: string,
    @Query('language') language?: string,
    @Query('audioType') audioType?: string,
  ): Promise<FunctionResponseDto[]> {
    return this.filterFunctionsService.execute(movieId, { date, cinemaId, roomId, format, language, audioType });
  }

  /**
   * Consulta los detalles de una función específica habilitada para selección de asientos.
   * @param id UUID de la función.
   * @returns Datos de la función con información de sala y cine.
   */
  @Get('functions/:id')
  @ApiOperation({
    summary: 'Obtiene el detalle de una función disponible',
    description: 'Valida que la función esté activa y que no haya comenzado antes de retornar sus detalles.',
  })
  @ApiParam({ name: 'id', description: 'Identificador único de la función (UUID)', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Detalle de la función retornado con éxito.', type: FunctionResponseDto })
  @ApiResponse({ status: 400, description: 'Identificador de función no tiene formato UUID válido.' })
  @ApiResponse({ status: 404, description: 'Función no encontrada o ya expirada.' })
  getFunction(@Param('id', ParseUUIDPipe) id: string): Promise<FunctionResponseDto> {
    return this.getFunctionService.execute(id);
  }

  /**
   * Obtiene la estructura tarifaria de la función (precio base + recargo de sala).
   * @param id UUID de la función.
   * @returns Desglose de precios según regla RN-037.
   */
  @Get('functions/:id/prices')
  @ApiOperation({
    summary: 'Obtiene el desglose de precios de una función',
    description: 'Aplica la regla RN-037 calculando tarifa base más recargo adicional según el tipo de sala.',
  })
  @ApiParam({ name: 'id', description: 'Identificador único de la función (UUID)', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Desglose de precio de la función.', type: FunctionPriceResponseDto })
  @ApiResponse({ status: 400, description: 'Identificador de función no tiene formato UUID válido.' })
  @ApiResponse({ status: 404, description: 'Función no encontrada o no disponible.' })
  getFunctionPrices(@Param('id', ParseUUIDPipe) id: string): Promise<FunctionPriceResponseDto> {
    return this.getFunctionPricesService.execute(id);
  }
}
