import { Injectable } from '@nestjs/common';

/**
 * Representa el resultado de la comprobación de salud del sistema.
 */
export interface HealthStatusResponse {
  status: 'ok' | 'error';
  timestamp: string;
  message: string;
}

/**
 * Servicio de infraestructura encargado de verificar el estado operacional del backend.
 * Utilizado por Kubernetes liveness/readiness probes y monitoreo externo.
 */
@Injectable()
export class HealthCheckService {
  /**
   * Ejecuta un chequeo de salud básico del proceso de la aplicación.
   * @returns Objeto con el estado 'ok', marca temporal ISO y mensaje descriptivo.
   */
  check(): HealthStatusResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API is healthy and running',
    };
  }
}
