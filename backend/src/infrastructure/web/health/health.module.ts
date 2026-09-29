import { Module } from '@nestjs/common';
import { HealthModule as CoreHealthModule } from '../../health/health.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [CoreHealthModule], // importamos logica de negocio
  controllers: [HealthController],
})
export class HealthModule {}
