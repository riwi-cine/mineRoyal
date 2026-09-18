import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthCheckService {
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API is healthy and running',
    };
  }
}
