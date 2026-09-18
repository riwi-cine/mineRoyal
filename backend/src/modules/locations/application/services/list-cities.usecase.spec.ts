import { NotFoundException } from '@nestjs/common';
import { ListCitiesUseCase } from './list-cities.usecase.js';
import { CityRepository } from '../../infrastructure/dao/city.dao.js';
import { DepartmentRepository } from '../../infrastructure/dao/department.dao.js';
import { City } from '../../domain/entities/city.entity.js';
import { Department } from '../../domain/entities/department.entity.js';

describe('ListCitiesUseCase', () => {
  const department: Department = {
    id: 'department-1',
    name: 'Antioquia',
    countryId: 'country-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Department;

  const city: City = {
    id: 'city-1',
    name: 'Medellín',
    departmentId: 'department-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as City;

  const buildUseCase = (
    departmentOverride: Department | null = department,
    cities: City[] = [city],
  ): { useCase: ListCitiesUseCase; cityRepository: CityRepository } => {
    const departmentRepository = {
      findById: vi.fn().mockResolvedValue(departmentOverride),
      findActiveByCountry: vi.fn(),
    } as unknown as DepartmentRepository;

    const cityRepository = {
      findActiveByDepartment: vi.fn().mockResolvedValue(cities),
      findById: vi.fn(),
    } as unknown as CityRepository;

    return { useCase: new ListCitiesUseCase(departmentRepository, cityRepository), cityRepository };
  };

  it('lists active cities for an existing active department', async () => {
    const { useCase, cityRepository } = buildUseCase();

    const result = await useCase.execute('department-1');

    expect(cityRepository.findActiveByDepartment).toHaveBeenCalledWith('department-1');
    expect(result).toEqual([{ id: 'city-1', name: 'Medellín', departmentId: 'department-1' }]);
  });

  it('throws NotFoundException when the department does not exist', async () => {
    const { useCase } = buildUseCase(null);

    await expect(useCase.execute('missing-department')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the department is inactive', async () => {
    const { useCase } = buildUseCase({ ...department, isActive: false });

    await expect(useCase.execute('department-1')).rejects.toThrow(NotFoundException);
  });
});
