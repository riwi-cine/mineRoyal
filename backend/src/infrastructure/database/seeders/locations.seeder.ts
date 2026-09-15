import { DataSource } from 'typeorm';
import { Cinema } from '../../../modules/locations/domain/entities/cinema.entity.js';
import { City } from '../../../modules/locations/domain/entities/city.entity.js';
import { Country } from '../../../modules/locations/domain/entities/country.entity.js';
import { Department } from '../../../modules/locations/domain/entities/department.entity.js';

/** Seeds a minimal country/department/city/cinema hierarchy for local development and tests. */
export async function seedLocations(dataSource: DataSource): Promise<void> {
  const countryRepo = dataSource.getRepository(Country);
  const departmentRepo = dataSource.getRepository(Department);
  const cityRepo = dataSource.getRepository(City);
  const cinemaRepo = dataSource.getRepository(Cinema);

  let colombia = await countryRepo.findOne({ where: { isoCode: 'CO' } });
  colombia ??= await countryRepo.save(countryRepo.create({ name: 'Colombia', isoCode: 'CO', isActive: true }));

  let antioquia = await departmentRepo.findOne({ where: { name: 'Antioquia', countryId: colombia.id } });
  antioquia ??= await departmentRepo.save(
    departmentRepo.create({ name: 'Antioquia', countryId: colombia.id, isActive: true }),
  );

  let medellin = await cityRepo.findOne({ where: { name: 'Medellín', departmentId: antioquia.id } });
  medellin ??= await cityRepo.save(cityRepo.create({ name: 'Medellín', departmentId: antioquia.id, isActive: true }));

  const existingCinema = await cinemaRepo.findOne({ where: { cityId: medellin.id } });
  if (!existingCinema) {
    await cinemaRepo.save(cinemaRepo.create({ name: 'Cine Royal Medellín', cityId: medellin.id, isActive: true }));
  }
}
