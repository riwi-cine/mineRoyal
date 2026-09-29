import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cinema } from './entities/cinema.entity.js';
import { City } from './entities/city.entity.js';
import { Country } from './entities/country.entity.js';
import { Department } from './entities/department.entity.js';
import { CinemaDao } from './dao/cinema.dao.js';
import { CityDao } from './dao/city.dao.js';
import { CountryDao } from './dao/country.dao.js';
import { DepartmentDao } from './dao/department.dao.js';
import { ListCitiesService } from './services/list-cities.service.js';
import { ListCountriesService } from './services/list-countries.service.js';
import { ListDepartmentsService } from './services/list-departments.service.js';
import { LocationsController } from './controllers/locations.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Country, Department, City, Cinema])],
  controllers: [LocationsController],
  providers: [
    CountryDao,
    DepartmentDao,
    CityDao,
    CinemaDao,
    ListCountriesService,
    ListDepartmentsService,
    ListCitiesService,
  ],
  exports: [CountryDao, DepartmentDao, CityDao, CinemaDao],
})
export class LocationsModule {}
