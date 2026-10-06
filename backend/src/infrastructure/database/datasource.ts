import * as typeorm from 'typeorm';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { SnakeCaseNamingStrategy } from './naming/snake-case.naming-strategy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * DataSource used exclusively by the TypeORM CLI (migrations, seeders).
 * Runtime DB connection is configured via `config/database.config.ts`.
 */
export const dataSourceOptions: typeorm.DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
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
