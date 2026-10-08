import { Controller, Get, Param, ParseIntPipe, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MovieDetailResponseDto } from '../dtos/movie-detail-response.dto.js';
import { MovieSummaryResponseDto } from '../dtos/movie-summary-response.dto.js';
import { GetMovieDetailService } from '../services/get-movie-detail.service.js';
import { ListMovieFunctionsByCityService } from '../services/list-movie-functions.service.js';
import { ListMovieRecommendationsService } from '../services/list-movie-recommendations.service.js';

/**
 * Controlador del Catálogo de Películas (HU-003, HU-004, HU-005).
 * Expone la consulta detallada de películas, funciones futuras según la ciudad del usuario
 * y recomendaciones algorítmicas por coincidencia de géneros.
 */
@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(
    private readonly getMovieDetailService: GetMovieDetailService,
    private readonly listMovieFunctionsService: ListMovieFunctionsByCityService,
    private readonly listMovieRecommendationsService: ListMovieRecommendationsService,
  ) {}

  /**
   * Consulta la ficha técnica completa de una película.
   * @param id Identificador UUID de la película.
   * @returns Ficha con director, géneros, actores, formatos, tráiler y clasificación.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Consulta el detalle completo de una película',
    description: 'Devuelve información enriquecida de la película, elenco, idiomas y formatos disponibles.',
  })
  @ApiParam({ name: 'id', description: 'Identificador único de la película (UUID)', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la película obtenido exitosamente.',
    type: MovieDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'El ID proporcionado no tiene formato UUID válido.' })
  @ApiResponse({ status: 404, description: 'Película no encontrada o inactiva.' })
  getDetail(@Param('id', ParseUUIDPipe) id: string): Promise<MovieDetailResponseDto> {
    return this.getMovieDetailService.execute(id);
  }

  /**
   * Consulta las funciones futuras de la película en los cines de la ciudad del usuario.
   * @param id UUID de la película.
   * @param userId Identificador del usuario para resolver su ciudad configurada.
   * @returns Listado de funciones con horarios, salas y formatos disponibles.
   */
  @Get(':id/functions')
  @ApiOperation({
    summary: 'Lista las funciones de una película por ciudad del usuario',
    description: 'Cruza la ubicación preferida del usuario con las funciones futuras de la película.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la película (UUID)', format: 'uuid' })
  @ApiQuery({
    name: 'userId',
    required: true,
    type: Number,
    description: 'Identificador numérico del usuario para determinar su ciudad.',
  })
  @ApiResponse({ status: 200, description: 'Funciones disponibles retornadas exitosamente.' })
  @ApiResponse({ status: 400, description: 'Parámetros id o userId con formato inválido.' })
  @ApiResponse({ status: 404, description: 'Película no encontrada.' })
  getFunctions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId', ParseIntPipe) userId: number,
  ): ReturnType<ListMovieFunctionsByCityService['execute']> {
    return this.listMovieFunctionsService.execute(id, userId);
  }

  /**
   * Consulta recomendaciones de películas basadas en similitud de géneros.
   * @param id UUID de la película base de recomendación.
   * @returns Listado de películas recomendadas ordenadas por coincidencia.
   */
  @Get(':id/recommendations')
  @ApiOperation({
    summary: 'Obtiene películas recomendadas similares',
    description: 'Calcula recomendaciones basadas en la coincidencia de géneros cinematográficos.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la película (UUID)', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Listado de películas recomendadas.', type: [MovieSummaryResponseDto] })
  @ApiResponse({ status: 400, description: 'Identificador no tiene formato UUID válido.' })
  @ApiResponse({ status: 404, description: 'Película no encontrada.' })
  getRecommendations(@Param('id', ParseUUIDPipe) id: string): Promise<MovieSummaryResponseDto[]> {
    return this.listMovieRecommendationsService.execute(id);
  }
}
