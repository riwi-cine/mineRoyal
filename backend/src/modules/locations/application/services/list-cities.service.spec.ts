import { NotFoundException } from '@nestjs/common';
import { ListCitiesService } from './list-cities.service.js';
import { CityRepository } from '../../infrastructure/dao/city.dao.js';
import { DepartmentRepository } from '../../infrastructure/dao/department.dao.js';
import { City } from '../../domain/entities/city.entity.js';
import { Department } from '../../domain/entities/department.entity.js';

describe('ListCitiesService', () => {
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
  ): { useService: ListCitiesService; cityRepository: CityRepository } => {
    const departmentRepository = {
      findById: vi.fn().mockResolvedValue(departmentOverride),
      findActiveByCountry: vi.fn(),
    } as unknown as DepartmentRepository;

    const cityRepository = {
      findActiveByDepartment: vi.fn().mockResolvedValue(cities),
      findById: vi.fn(),
    } as unknown as CityRepository;

    return { useService: new ListCitiesService(departmentRepository, cityRepository), cityRepository };
  };

  it('lists active cities for an existing active department', async () => {
    const { useService, cityRepository } = buildUseCase();

    const result = await useService.execute('department-1');

    expect(cityRepository.findActiveByDepartment).toHaveBeenCalledWith('department-1');
    expect(result).toEqual([{ id: 'city-1', name: 'Medellín', departmentId: 'department-1' }]);
  });

  it('throws NotFoundException when the department does not exist', async () => {
    const { useService } = buildUseCase(null);

    await expect(useService.execute('missing-department')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the department is inactive', async () => {
    const { useService } = buildUseCase({ ...department, isActive: false });

    await expect(useService.execute('department-1')).rejects.toThrow(NotFoundException);
  });
});