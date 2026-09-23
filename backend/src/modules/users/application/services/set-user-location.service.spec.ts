import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SetUserLocationService } from './set-user-location.service.js';
import { CinemaRepository } from '../../../locations/infrastructure/dao/cinema.dao.js';
import { CityRepository } from '../../../locations/infrastructure/dao/city.dao.js';
import { CountryRepository } from '../../../locations/infrastructure/dao/country.dao.js';
import { DepartmentRepository } from '../../../locations/infrastructure/dao/department.dao.js';
import { UserLocationRepository } from '../../infrastructure/dao/user-location.repository.js';
import { Country } from '../../../locations/domain/entities/country.entity.js';
import { Department } from '../../../locations/domain/entities/department.entity.js';
import { City } from '../../../locations/domain/entities/city.entity.js';
import { UserLocation } from '../../domain/entities/user-location.entity.js';
import { SetUserLocationDto } from '../dtos/set-user-location.dto.js';

describe('SetUserLocationService', () => {
  const dto: SetUserLocationDto = {
    userId: 'user-1',
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
    userId: 'user-1',
    countryId: 'country-1',
    departmentId: 'department-1',
    cityId: 'city-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserLocation;

  const buildUseCase = (
    overrides: {
      country?: Country | null;
      department?: Department | null;
      city?: City | null;
      activeCinemas?: number;
    } = {},
  ) => {
    const countryRepository = {
      findById: vi.fn().mockResolvedValue('country' in overrides ? overrides.country : country),
      findAllActive: vi.fn(),
    } as unknown as CountryRepository;

    const departmentRepository = {
      findById: vi.fn().mockResolvedValue('department' in overrides ? overrides.department : department),
      findActiveByCountry: vi.fn(),
    } as unknown as DepartmentRepository;

    const cityRepository = {
      findById: vi.fn().mockResolvedValue('city' in overrides ? overrides.city : city),
      findActiveByDepartment: vi.fn(),
    } as unknown as CityRepository;

    const cinemaRepository = {
      countActiveByCity: vi.fn().mockResolvedValue(overrides.activeCinemas ?? 1),
    } as unknown as CinemaRepository;

    const userLocationRepository = {
      upsert: vi.fn().mockResolvedValue(userLocation),
      findByUserId: vi.fn(),
    } as unknown as UserLocationRepository;

    return {
      useService: new SetUserLocationService(
        countryRepository,
        departmentRepository,
        cityRepository,
        cinemaRepository,
        userLocationRepository,
      ),
      userLocationRepository,
      cinemaRepository,
    };
  };

  it('saves the location when everything is valid', async () => {
    const { useService, userLocationRepository } = buildUseCase();

    const result = await useService.execute(dto);

    expect(userLocationRepository.upsert).toHaveBeenCalledWith('user-1', 'country-1', 'department-1', 'city-1');
    expect(result.cityId).toBe('city-1');
    expect(result.message).toBe('Ubicación guardada correctamente.');
  });

  it('updates the location on a subsequent call (upsert)', async () => {
    const { useService, userLocationRepository } = buildUseCase();

    await useService.execute(dto);
    await useService.execute({ ...dto, cityId: 'city-1' });

    expect(userLocationRepository.upsert).toHaveBeenCalledTimes(2);
  });

  it('throws NotFoundException when the country does not exist', async () => {
    const { useService } = buildUseCase({ country: null });

    await expect(useService.execute(dto)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the department does not exist', async () => {
    const { useService } = buildUseCase({ department: null });

    await expect(useService.execute(dto)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the city does not exist', async () => {
    const { useService } = buildUseCase({ city: null });

    await expect(useService.execute(dto)).rejects.toThrow(NotFoundException);
  });

  it('rejects a department that does not belong to the given country', async () => {
    const { useService } = buildUseCase({ department: { ...department, countryId: 'other-country' } });

    await expect(useService.execute(dto)).rejects.toThrow(BadRequestException);
  });

  it('rejects a city that does not belong to the given department', async () => {
    const { useService } = buildUseCase({ city: { ...city, departmentId: 'other-department' } });

    await expect(useService.execute(dto)).rejects.toThrow(BadRequestException);
  });

  it('rejects an inactive city', async () => {
    const { useService } = buildUseCase({ city: { ...city, isActive: false } });

    await expect(useService.execute(dto)).rejects.toThrow(BadRequestException);
  });

  it('rejects a city without active cinemas', async () => {
    const { useService, cinemaRepository } = buildUseCase({ activeCinemas: 0 });

    await expect(useService.execute(dto)).rejects.toThrow(BadRequestException);
    expect(cinemaRepository.countActiveByCity).toHaveBeenCalledWith('city-1');
  });
});