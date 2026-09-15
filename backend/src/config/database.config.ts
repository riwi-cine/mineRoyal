import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeCaseNamingStrategy } from '../infrastructure/database/naming/snake-case.naming-strategy.js';

export const typeOrmConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.get<string>('DB_HOST', 'localhost'),
  port: config.get<number>('DB_PORT', 5432),
  username: config.get<string>('DB_USERNAME', 'postgres'),
  password: config.get<string>('DB_PASSWORD', 'postgres'),
  database: config.get<string>('DB_NAME', 'mineroyal'),
  autoLoadEntities: true,
  namingStrategy: new SnakeCaseNamingStrategy(),
  synchronize: false,
});


