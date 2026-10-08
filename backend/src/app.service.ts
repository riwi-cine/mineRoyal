import { Injectable } from '@nestjs/common';

/**
 * Servicio raíz de la aplicación mineRoyal.
 * Provee información inicial de estado y bienvenida al API.
 */
@Injectable()
export class AppService {
  /**
   * Retorna el mensaje de bienvenida oficial de la API.
   * @returns Mensaje de saludo de mineRoyal API.
   */
  getHello(): string {
    return 'Welcome to MineRoyal API!';
  }
}
