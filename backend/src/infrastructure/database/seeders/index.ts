import { seedLocations } from './locations.seeder.js';
import { dataSourceOptions } from '../datasource.js';
import { DataSource } from 'typeorm';

async function main(): Promise<void> {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();
  await seedLocations(dataSource);
  await dataSource.destroy();
}

main()
  .then(() => console.log('Seeders ejecutados correctamente.'))
  .catch((error: unknown) => {
    console.error('Error ejecutando los seeders:', error);
    process.exitCode = 1;
  });
