import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { REDIS_CLIENT, RedisService } from './redis.service.js';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const port = Number(config.get('REDIS_PORT', '6379'));
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          throw new Error('REDIS_PORT debe ser un puerto válido.');
        }

        const password = config.get<string>('REDIS_PASSWORD');
        return new Redis({
          host: config.get<string>('REDIS_HOST', '127.0.0.1'),
          port,
          ...(password ? { password } : {}),
          lazyConnect: true,
          maxRetriesPerRequest: 2,
          retryStrategy: (attempt) => (attempt <= 5 ? Math.min(attempt * 200, 1000) : null),
        });
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
