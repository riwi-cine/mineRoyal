import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CinemaDao } from '../../locations/dao/cinema.dao.js';
import { CityDao } from '../../locations/dao/city.dao.js';
import { CountryDao } from '../../locations/dao/country.dao.js';
import { DepartmentDao } from '../../locations/dao/department.dao.js';
import { City } from '../../locations/entities/city.entity.js';
import { Country } from '../../locations/entities/country.entity.js';
import { Department } from '../../locations/entities/department.entity.js';
import { UserLocationDao } from '../dao/user-location.dao.js';
import { SetUserLocationDto } from '../dtos/set-user-location.dto.js';
import { UserLocation } from '../entities/user-location.entity.js';
import { SetUserLocationService } from './set-user-location.service.js';

describe('SetUserLocationService', () => {
  const dto: SetUserLocationDto = {
    userId: 1,
    countryId: 'country-1',
    departmentId: 'department-1',
    cityId: 'city-1',
  };

  const country: Country = { id: 'country-1', name: 'Colombia', isoCode: 'CO', isActive: true } as Country;
  const department: Department = {
    id: 'department-1',
    name: 'Antioquia',
    countryId: 'country-1',
    isActive: true,
  } as Department;
  const city: City = { id: 'city-1', name: 'Medellín', departmentId: 'department-1', isActive: true } as City;

  const userLocation: UserLocation = {
    id: 'location-1',
    userId: 1,
    countryId: 'country-1',
    departmentId: 'department-1',
    cityId: 'city-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserLocation;

  const buildService = (
    overrides: {
      country?: Country | null;
      department?: Department | null;
      city?: City | null;
      activeCinemas?: number;
    } = {},
  ) => {
    const countryDao = {
      findById: vi.fn().mockResolvedValue('country' in overrides ? overrides.country : country),
      findAllActive: vi.fn(),
    } as unknown as CountryDao;

    const departmentDao = {
      findById: vi.fn().mockResolvedValue('department' in overrides ? overrides.department : department),
      findActiveByCountry: vi.fn(),
    } as unknown as DepartmentDao;

    const cityDao = {
      findById: vi.fn().mockResolvedValue('city' in overrides ? overrides.city : city),
      findActiveByDepartment: vi.fn(),
    } as unknown as CityDao;

    const cinemaDao = {
      countActiveByCity: vi.fn().mockResolvedValue(overrides.activeCinemas ?? 1),
    } as unknown as CinemaDao;

    const userLocationDao = {
      upsert: vi.fn().mockResolvedValue(userLocation),
      findByUserId: vi.fn(),
    } as unknown as UserLocationDao;

    return {
      service: new SetUserLocationService(countryDao, departmentDao, cityDao, cinemaDao, userLocationDao),
      userLocationDao,
      cinemaDao,
    };
  };

  it('saves the location when everything is valid', async () => {
    const { service, userLocationDao } = buildService();

    const result = await service.execute(dto);

    expect(userLocationDao.upsert).toHaveBeenCalledWith(1, 'country-1', 'department-1', 'city-1');
    expect(result.cityId).toBe('city-1');
    expect(result.message).toBe('Ubicación guardada correctamente.');
  });

  it('updates the location on a subsequent call (upsert)', async () => {
    const { service, userLocationDao } = buildService();

    await service.execute(dto);
    await service.execute({ ...dto, cityId: 'city-1' });

    expect(userLocationDao.upsert).toHaveBeenCalledTimes(2);
  });

  it('throws NotFoundException when the country does not exist', async () => {
    const { service } = buildService({ country: null });

    await expect(service.execute(dto)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the department does not exist', async () => {
    const { service } = buildService({ department: null });

    await expect(service.execute(dto)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the city does not exist', async () => {
    const { service } = buildService({ city: null });

    await expect(service.execute(dto)).rejects.toThrow(NotFoundException);
  });

  it('rejects a department that does not belong to the given country', async () => {
    const { service } = buildService({ department: { ...department, countryId: 'other-country' } });

    await expect(service.execute(dto)).rejects.toThrow(BadRequestException);
  });

  it('rejects a city that does not belong to the given department', async () => {
    const { service } = buildService({ city: { ...city, departmentId: 'other-department' } });

    await expect(service.execute(dto)).rejects.toThrow(BadRequestException);
  });

  it('rejects an inactive city', async () => {
    const { service } = buildService({ city: { ...city, isActive: false } });

    await expect(service.execute(dto)).rejects.toThrow(BadRequestException);
  });

  it('rejects a city without active cinemas', async () => {
    const { service, cinemaDao } = buildService({ activeCinemas: 0 });

    await expect(service.execute(dto)).rejects.toThrow(BadRequestException);
    expect(cinemaDao.countActiveByCity).toHaveBeenCalledWith('city-1');
  });
});
