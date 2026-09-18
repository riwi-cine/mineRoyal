import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MovieDetailResponseDto } from '../../application/dtos/movie-detail-response.dto.js';
import { MovieSummaryResponseDto } from '../../application/dtos/movie-summary-response.dto.js';
import { GetMovieDetailUseCase } from '../../application/usecases/get-movie-detail.usecase.js';
import { ListMovieFunctionsUseCase } from '../../application/usecases/list-movie-functions.usecase.js';
import { ListMovieRecommendationsUseCase } from '../../application/usecases/list-movie-recommendations.usecase.js';

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(
    private readonly getMovieDetailUseCase: GetMovieDetailUseCase,
    private readonly listMovieFunctionsUseCase: ListMovieFunctionsUseCase,
    private readonly listMovieRecommendationsUseCase: ListMovieRecommendationsUseCase,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Consulta el detalle completo de una película.' })
  @ApiParam({ name: 'id', description: 'Identificador de la película', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Detalle de la película.', type: MovieDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Película no encontrada.' })
  getDetail(@Param('id', ParseUUIDPipe) id: string): Promise<MovieDetailResponseDto> {
    return this.getMovieDetailUseCase.execute(id);
  }

  @Get(':id/functions')
  @ApiOperation({ summary: 'Lista las funciones futuras de una película para la ciudad del usuario.' })
  @ApiParam({ name: 'id', description: 'Identificador de la película', format: 'uuid' })
  @ApiQuery({ name: 'userId', required: true, description: 'Identificador del usuario (temporal hasta autenticación)' })
  @ApiResponse({ status: 200, description: 'Funciones disponibles para la película.' })
  @ApiResponse({ status: 404, description: 'Película no encontrada.' })
  getFunctions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId', ParseUUIDPipe) userId: string,
  ): ReturnType<ListMovieFunctionsUseCase['execute']> {
    return this.listMovieFunctionsUseCase.execute(id, userId);
  }

  @Get(':id/recommendations')
  @ApiOperation({ summary: 'Obtiene películas recomendadas similares a la película indicada.' })
  @ApiParam({ name: 'id', description: 'Identificador de la película', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Listado de películas recomendadas.', type: [MovieSummaryResponseDto] })
  @ApiResponse({ status: 404, description: 'Película no encontrada.' })
  getRecommendations(@Param('id', ParseUUIDPipe) id: string): Promise<MovieSummaryResponseDto[]> {
    return this.listMovieRecommendationsUseCase.execute(id);
  }
}
