import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheckService } from '../../health/health-check.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly HealthCheckService: HealthCheckService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check the health of the API' })
  @ApiResponse({ status: 200, description: 'API is healthy and running' })
  check() {
    return this.HealthCheckService.check();
  }
}
