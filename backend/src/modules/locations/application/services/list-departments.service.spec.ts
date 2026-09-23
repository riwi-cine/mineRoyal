import { NotFoundException } from '@nestjs/common';
import { ListDepartmentsService } from './list-departments.service.js';
import { CountryRepository } from '../../infrastructure/dao/country.dao.js';
import { DepartmentRepository } from '../../infrastructure/dao/department.dao.js';
import { Country } from '../../domain/entities/country.entity.js';
import { Department } from '../../domain/entities/department.entity.js';

describe('ListDepartmentsService', () => {
  const country: Country = {
    id: 'country-1',
    name: 'Colombia',
    isoCode: 'CO',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Country;

  const department: Department = {
    id: 'department-1',
    name: 'Antioquia',
    countryId: 'country-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Department;

  const buildUseCase = (
    countryOverride: Country | null = country,
    departments: Department[] = [department],
  ): { useService: ListDepartmentsService; departmentRepository: DepartmentRepository } => {
    const countryRepository = {
      findById: vi.fn().mockResolvedValue(countryOverride),
      findAllActive: vi.fn(),
    } as unknown as CountryRepository;

    const departmentRepository = {
      findActiveByCountry: vi.fn().mockResolvedValue(departments),
      findById: vi.fn(),
    } as unknown as DepartmentRepository;

    return { useService: new ListDepartmentsService(countryRepository, departmentRepository), departmentRepository };
  };

  it('lists active departments for an existing active country', async () => {
    const { useService, departmentRepository } = buildUseCase();

    const result = await useService.execute('country-1');

    expect(departmentRepository.findActiveByCountry).toHaveBeenCalledWith('country-1');
    expect(result).toEqual([{ id: 'department-1', name: 'Antioquia', countryId: 'country-1' }]);
  });

  it('throws NotFoundException when the country does not exist', async () => {
    const { useService } = buildUseCase(null);

    await expect(useService.execute('missing-country')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the country is inactive', async () => {
    const { useService } = buildUseCase({ ...country, isActive: false });

    await expect(useService.execute('country-1')).rejects.toThrow(NotFoundException);
  });
});