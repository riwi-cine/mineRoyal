import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { CinemaRepository } from '../../src/modules/locations/infrastructure/dao/cinema.dao.js';
import { CityRepository } from '../../src/modules/locations/infrastructure/dao/city.dao.js';
import { CountryRepository } from '../../src/modules/locations/infrastructure/dao/country.dao.js';
import { DepartmentRepository } from '../../src/modules/locations/infrastructure/dao/department.dao.js';
import { ListCitiesUseCase } from '../../src/modules/locations/application/services/list-cities.usecase.js';
import { ListCountriesUseCase } from '../../src/modules/locations/application/services/list-countries.usecase.js';
import { ListDepartmentsUseCase } from '../../src/modules/locations/application/services/list-departments.usecase.js';
import { LocationsController } from '../../src/modules/locations/ui/controllers/locations.controller.js';
import { UserLocationRepository } from '../../src/modules/users/infrastructure/dao/user-location.repository.js';
import { SetUserLocationUseCase } from '../../src/modules/users/application/services/set-user-location.usecase.js';
import { UsersController } from '../../src/modules/users/ui/controllers/users.controller.js';

const countryId = '11111111-1111-4111-a111-111111111111';
const departmentId = '22222222-2222-4222-a222-222222222222';
const cityId = '33333333-3333-4333-a333-333333333333';
const userId = '44444444-4444-4444-a444-444444444444';

const country = { id: countryId, name: 'Colombia', isoCode: 'CO', isActive: true };
const department = { id: departmentId, name: 'Antioquia', countryId, isActive: true };
const city = { id: cityId, name: 'Medellín', departmentId, isActive: true };

describe('Location selection (e2e happy path)', () => {
  let app: INestApplication;
  let savedLocation: Record<string, unknown> | null = null;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController, UsersController],
      providers: [
        ListCountriesUseCase,
        ListDepartmentsUseCase,
        ListCitiesUseCase,
        SetUserLocationUseCase,
        {
          provide: CountryRepository,
          useValue: { findAllActive: async () => [country], findById: async () => country },
        },
        {
          provide: DepartmentRepository,
          useValue: { findActiveByCountry: async () => [department], findById: async () => department },
        },
        {
          provide: CityRepository,
          useValue: { findActiveByDepartment: async () => [city], findById: async () => city },
        },
        { provide: CinemaRepository, useValue: { countActiveByCity: async () => 1 } },
        {
          provide: UserLocationRepository,
          useValue: {
            findByUserId: async () => savedLocation,
            upsert: async (uId: string, cId: string, dId: string, ciId: string) => {
              savedLocation = { userId: uId, countryId: cId, departmentId: dId, cityId: ciId };
              return savedLocation;
            },
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('walks through country -> department -> city -> save location', async () => {
    const countries = await request(app.getHttpServer()).get('/countries').expect(200);
    expect(countries.body).toEqual([{ id: countryId, name: 'Colombia', isoCode: 'CO' }]);

    const departments = await request(app.getHttpServer()).get(`/departments/${countryId}`).expect(200);
    expect(departments.body).toEqual([{ id: departmentId, name: 'Antioquia', countryId }]);

    const cities = await request(app.getHttpServer()).get(`/cities/${departmentId}`).expect(200);
    expect(cities.body).toEqual([{ id: cityId, name: 'Medellín', departmentId }]);

    const location = await request(app.getHttpServer())
      .post('/users/location')
      .send({ userId, countryId, departmentId, cityId })
      .expect(201);

    expect(location.body).toMatchObject({
      userId,
      countryId,
      departmentId,
      cityId,
      message: 'Ubicación guardada correctamente.',
    });
  });
});
