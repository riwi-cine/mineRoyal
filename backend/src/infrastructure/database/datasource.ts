import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeCaseNamingStrategy } from './naming/snake-case.naming-strategy.js';

/**
 * DataSource used exclusively by the TypeORM CLI (migrations, seeders).
 * Runtime DB connection is configured via `config/database.config.ts`.
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'mineroyal',
  entities: [`${__dirname}/../../modules/**/domain/entities/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  namingStrategy: new SnakeCaseNamingStrategy(),
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
