import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetFunctionPricesService } from '../../application/services/get-function-prices.service.js';
import { GetFunctionService } from '../../application/services/get-function.service.js';
import { ListMovieFunctionsService } from '../../application/services/list-movie-functions.service.js';
import { FunctionPriceResponseDto } from '../../application/dtos/function-price.dto.js';
import { FunctionResponseDto } from '../../application/dtos/function-response.dto.js';

/**
 * HU-009 — Selección de Función y Formato de Proyección.
 */
@ApiTags('functions')
@Controller()
export class FunctionsController {
  constructor(
    private readonly listMovieFunctionsUseCase: ListMovieFunctionsService,
    private readonly getFunctionUseCase: GetFunctionService,
    private readonly getFunctionPricesUseCase: GetFunctionPricesService,
  ) {}

  @Get('movies/:movieId/functions')
  @ApiOperation({
    summary: 'Lista las funciones activas y aún no iniciadas de una película (RN-035, RN-036), con filtros opcionales.',
  })
  @ApiParam({ name: 'movieId', description: 'Identificador de la película', format: 'uuid' })
  @ApiQuery({ name: 'date', required: false, example: '2026-09-20', description: 'Filtra por fecha (YYYY-MM-DD).' })
  @ApiQuery({ name: 'cinemaId', required: false, type: String, description: 'Filtra por complejo de cine.' })
  @ApiQuery({ name: 'roomId', required: false, type: String, description: 'Filtra por sala.' })
  @ApiQuery({ name: 'format', required: false, example: '3D', description: 'Filtra por formato de proyección.' })
  @ApiQuery({ name: 'language', required: false, example: 'ES', description: 'Filtra por idioma.' })
  @ApiQuery({ name: 'audioType', required: false, enum: ['DOBLADA', 'SUBTITULADA'] })
  @ApiResponse({ status: 200, description: 'Listado de funciones disponibles.', type: [FunctionResponseDto] })
  @ApiResponse({ status: 404, description: 'Película no encontrada.' })
  listMovieFunctions(
    @Param('movieId', ParseUUIDPipe) movieId: string,
    @Query('date') date?: string,
    @Query('cinemaId', new ParseUUIDPipe({ optional: true })) cinemaId?: string,
    @Query('roomId', new ParseUUIDPipe({ optional: true })) roomId?: string,
    @Query('format') format?: string,
    @Query('language') language?: string,
    @Query('audioType') audioType?: string,
  ): Promise<FunctionResponseDto[]> {
    return this.listMovieFunctionsUseCase.execute(movieId, { date, cinemaId, roomId, format, language, audioType });
  }

  @Get('functions/:id')
  @ApiOperation({ summary: 'Obtiene el detalle de una función disponible para selección.' })
  @ApiParam({ name: 'id', description: 'Identificador de la función', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Detalle de la función.', type: FunctionResponseDto })
  @ApiResponse({ status: 404, description: 'Función no encontrada o ya no disponible.' })
  getFunction(@Param('id', ParseUUIDPipe) id: string): Promise<FunctionResponseDto> {
    return this.getFunctionUseCase.execute(id);
  }

  @Get('functions/:id/prices')
  @ApiOperation({ summary: 'Obtiene el desglose de precio de una función (RN-037).' })
  @ApiParam({ name: 'id', description: 'Identificador de la función', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Precio de la función.', type: FunctionPriceResponseDto })
  @ApiResponse({ status: 404, description: 'Función no encontrada o ya no disponible.' })
  getFunctionPrices(@Param('id', ParseUUIDPipe) id: string): Promise<FunctionPriceResponseDto> {
    return this.getFunctionPricesUseCase.execute(id);
  }
}