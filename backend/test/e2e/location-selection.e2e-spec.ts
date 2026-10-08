import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { CinemaDao } from '../../src/modules/locations/dao/cinema.dao.js';
import { CityDao } from '../../src/modules/locations/dao/city.dao.js';
import { CountryDao } from '../../src/modules/locations/dao/country.dao.js';
import { DepartmentDao } from '../../src/modules/locations/dao/department.dao.js';
import { ListCitiesService } from '../../src/modules/locations/services/list-cities.service.js';
import { ListCountriesService } from '../../src/modules/locations/services/list-countries.service.js';
import { ListDepartmentsService } from '../../src/modules/locations/services/list-departments.service.js';
import { LocationsController } from '../../src/modules/locations/controllers/locations.controller.js';
import { UserLocationDao } from '../../src/modules/users/dao/user-location.dao.js';
import { SetUserLocationService } from '../../src/modules/users/services/set-user-location.service.js';
import { UsersService } from '../../src/modules/users/services/users.service.js';
import { UsersController } from '../../src/modules/users/controllers/users.controller.js';

vi.mock('bcrypt', () => ({ compare: vi.fn(), hash: vi.fn() }));

const countryId = '11111111-1111-4111-a111-111111111111';
const departmentId = '22222222-2222-4222-a222-222222222222';
const cityId = '33333333-3333-4333-a333-333333333333';
const userId = 1;

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
        ListCountriesService,
        ListDepartmentsService,
        ListCitiesService,
        SetUserLocationService,
        { provide: UsersService, useValue: {} },
        {
          provide: CountryDao,
          useValue: { findAllActive: async () => [country], findById: async () => country },
        },
        {
          provide: DepartmentDao,
          useValue: { findActiveByCountry: async () => [department], findById: async () => department },
        },
        {
          provide: CityDao,
          useValue: { findActiveByDepartment: async () => [city], findById: async () => city },
        },
        { provide: CinemaDao, useValue: { countActiveByCity: async () => 1 } },
        {
          provide: UserLocationDao,
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
