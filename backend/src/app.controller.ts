import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

/**
 * Controlador raíz de la API mineRoyal.
 * Expone la ruta base para verificación de conectividad preliminar.
 */
@ApiTags('root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Endpoint de bienvenida e introducción a la API.
   * @returns Mensaje de bienvenida de mineRoyal.
   */
  @Get()
  @ApiOperation({
    summary: 'Mensaje de bienvenida al API',
    description: 'Endpoint raíz utilizado para confirmar la disponibilidad básica del servidor.',
  })
  @ApiResponse({
    status: 200,
    description: 'Mensaje de bienvenida retornado exitosamente.',
    schema: { type: 'string', example: 'Welcome to MineRoyal API!' },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
