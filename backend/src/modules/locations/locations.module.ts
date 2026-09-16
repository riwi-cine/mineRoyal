import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cinema } from './domain/entities/cinema.entity.js';
import { City } from './domain/entities/city.entity.js';
import { Country } from './domain/entities/country.entity.js';
import { Department } from './domain/entities/department.entity.js';
import { CinemaRepository } from './infrastructure/dao/cinema.dao.js';
import { CityRepository } from './infrastructure/dao/city.dao.js';
import { CountryRepository } from './infrastructure/dao/country.dao.js';
import { DepartmentRepository } from './infrastructure/dao/department.dao.js';
import { ListCitiesUseCase } from './application/services/list-cities.usecase.js';
import { ListCountriesUseCase } from './application/services/list-countries.usecase.js';
import { ListDepartmentsUseCase } from './application/services/list-departments.usecase.js';
import { LocationsController } from './ui/controllers/locations.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Country, Department, City, Cinema])],
  controllers: [LocationsController],
  providers: [
    CountryRepository,
    DepartmentRepository,
    CityRepository,
    CinemaRepository,
    ListCountriesUseCase,
    ListDepartmentsUseCase,
    ListCitiesUseCase,
  ],
  exports: [CountryRepository, DepartmentRepository, CityRepository, CinemaRepository],
})
export class LocationsModule {}
