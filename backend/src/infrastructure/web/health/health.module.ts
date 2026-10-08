import { Module } from '@nestjs/common';
import { HealthInfrastructureModule } from '../../health/health.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [HealthInfrastructureModule],
  controllers: [HealthController],
})
export class HealthWebModule {}

export { HealthWebModule as HealthModule };
