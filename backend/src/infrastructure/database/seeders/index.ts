import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../datasource.js';
import { seedLocations } from './locations.seeder.js';
import { seedMovies } from './movies.seeder.js';

async function main(): Promise<void> {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();
  await seedLocations(dataSource);
  await seedMovies(dataSource);
  await dataSource.destroy();
}

main()
  .then(() => console.log('Seeders ejecutados correctamente.'))
  .catch((error: unknown) => {
    console.error('Error ejecutando los seeders:', error);
    process.exitCode = 1;
  });
