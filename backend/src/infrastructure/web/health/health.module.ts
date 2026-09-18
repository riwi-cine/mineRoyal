import { Module } from '@nestjs/common';
import { HealthModule as CoreHealthModule } from '../../health/health.module';
import { HealthController } from './health.controller';

@Module({
  imports: [CoreHealthModule], // importamos logica de negocio
  controllers: [HealthController],
})
export class HealthModule {}
