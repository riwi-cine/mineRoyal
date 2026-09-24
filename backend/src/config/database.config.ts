import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SnakeCaseNamingStrategy } from '../infrastructure/database/naming/snake-case.naming-strategy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const typeOrmConfig = (config: ConfigService): TypeOrmModuleOptions => {
  const url = config.get<string>('DATABASE_URL');

  return {
    type: 'postgres',
    ...(url
      ? { url }
      : {
          host: config.get<string>('DB_HOST', 'postgres'),
          port: config.get<number>('DB_PORT', 5432),
          username: config.get<string>('DB_USERNAME', 'postgres'),
          password: config.get<string>('DB_PASSWORD', 'postgres'),
          database: config.get<string>('DB_NAME', 'mineroyal'),
        }),
    autoLoadEntities: true,
    migrations: [join(__dirname, '../infrastructure/database/migrations/*{.ts,.js}')],
    migrationsRun: true,
    namingStrategy: new SnakeCaseNamingStrategy(),
    synchronize: false,
  };
};
