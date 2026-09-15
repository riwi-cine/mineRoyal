import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SetUserLocationUseCase } from './set-user-location.usecase.js';
import { CinemaRepository } from '../../../locations/infrastructure/dao/cinema.repository.js';
import { CityRepository } from '../../../locations/infrastructure/dao/city.repository.js';
import { CountryRepository } from '../../../locations/infrastructure/dao/country.repository.js';
import { DepartmentRepository } from '../../../locations/infrastructure/dao/department.repository.js';
import { UserLocationRepository } from '../../infrastructure/dao/user-location.repository.js';
import { Country } from '../../../locations/domain/entities/country.entity.js';
import { Department } from '../../../locations/domain/entities/department.entity.js';
import { City } from '../../../locations/domain/entities/city.entity.js';
import { UserLocation } from '../../domain/entities/user-location.entity.js';
import { SetUserLocationDto } from '../dtos/set-user-location.dto.js';

describe('SetUserLocationUseCase', () => {
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
      findById: jest.fn().mockResolvedValue('country' in overrides ? overrides.country : country),
      findAllActive: jest.fn(),
    } as unknown as CountryRepository;

    const departmentRepository = {
      findById: jest.fn().mockResolvedValue('department' in overrides ? overrides.department : department),
      findActiveByCountry: jest.fn(),
    } as unknown as DepartmentRepository;

    const cityRepository = {
      findById: jest.fn().mockResolvedValue('city' in overrides ? overrides.city : city),
      findActiveByDepartment: jest.fn(),
    } as unknown as CityRepository;

    const cinemaRepository = {
      countActiveByCity: jest.fn().mockResolvedValue(overrides.activeCinemas ?? 1),
    } as unknown as CinemaRepository;

    const userLocationRepository = {
      upsert: jest.fn().mockResolvedValue(userLocation),
      findByUserId: jest.fn(),
    } as unknown as UserLocationRepository;

    return {
      useCase: new SetUserLocationUseCase(
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
    const { useCase, userLocationRepository } = buildUseCase();

    const result = await useCase.execute(dto);

    expect(userLocationRepository.upsert).toHaveBeenCalledWith('user-1', 'country-1', 'department-1', 'city-1');
    expect(result.cityId).toBe('city-1');
    expect(result.message).toBe('Ubicación guardada correctamente.');
  });

  it('updates the location on a subsequent call (upsert)', async () => {
    const { useCase, userLocationRepository } = buildUseCase();

    await useCase.execute(dto);
    await useCase.execute({ ...dto, cityId: 'city-1' });

    expect(userLocationRepository.upsert).toHaveBeenCalledTimes(2);
  });

  it('throws NotFoundException when the country does not exist', async () => {
    const { useCase } = buildUseCase({ country: null });

    await expect(useCase.execute(dto)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the department does not exist', async () => {
    const { useCase } = buildUseCase({ department: null });

    await expect(useCase.execute(dto)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the city does not exist', async () => {
    const { useCase } = buildUseCase({ city: null });

    await expect(useCase.execute(dto)).rejects.toThrow(NotFoundException);
  });

  it('rejects a department that does not belong to the given country', async () => {
    const { useCase } = buildUseCase({ department: { ...department, countryId: 'other-country' } });

    await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
  });

  it('rejects a city that does not belong to the given department', async () => {
    const { useCase } = buildUseCase({ city: { ...city, departmentId: 'other-department' } });

    await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
  });

  it('rejects an inactive city', async () => {
    const { useCase } = buildUseCase({ city: { ...city, isActive: false } });

    await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
  });

  it('rejects a city without active cinemas', async () => {
    const { useCase, cinemaRepository } = buildUseCase({ activeCinemas: 0 });

    await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
    expect(cinemaRepository.countActiveByCity).toHaveBeenCalledWith('city-1');
  });
});
