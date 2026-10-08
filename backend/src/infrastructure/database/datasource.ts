import { dirname, join } from 'path';
import * as typeorm from 'typeorm';
import { fileURLToPath } from 'url';
import { SnakeCaseNamingStrategy } from './naming/snake-case.naming-strategy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env when running the CLI outside Docker (vars already set take precedence).
try {
  process.loadEnvFile();
} catch {
  // No .env file present — rely on the existing environment.
}

/**
 * DataSource used exclusively by the TypeORM CLI (migrations, seeders).
 * Runtime DB connection is configured via `config/database.config.ts`.
 */
export const dataSourceOptions: typeorm.DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'postgres',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'mineroyal',
  entities: [join(__dirname, '../../modules/**/entities/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
  namingStrategy: new SnakeCaseNamingStrategy(),
  synchronize: false,
};

const dataSource = new typeorm.DataSource(dataSourceOptions);
export default dataSource;
