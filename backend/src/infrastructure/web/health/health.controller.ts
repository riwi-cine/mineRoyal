import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheckService, type HealthStatusResponse } from '../../health/health-check.service.js';

/**
 * Controlador de observabilidad y chequeo de salud del servicio.
 * Expone la ruta `/health` requerida por orquestadores (Docker, Kubernetes).
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  /**
   * Consulta el estado de vitalidad (Liveness / Readiness) de la API.
   * @returns Estado del servicio con marca de tiempo.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Comprueba el estado de salud de la API',
    description: 'Retorna 200 OK cuando el servidor está respondiendo adecuadamente a solicitudes HTTP.',
  })
  @ApiResponse({
    status: 200,
    description: 'La API está en ejecución y saludable.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2026-10-08T14:40:00.000Z' },
        message: { type: 'string', example: 'API is healthy and running' },
      },
    },
  })
  check(): HealthStatusResponse {
    return this.healthCheckService.check();
  }
}
