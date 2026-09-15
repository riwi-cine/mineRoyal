import { NotFoundException } from '@nestjs/common';
import { ListDepartmentsUseCase } from './list-departments.usecase.js';
import { CountryRepository } from '../../infrastructure/dao/country.repository.js';
import { DepartmentRepository } from '../../infrastructure/dao/department.repository.js';
import { Country } from '../../domain/entities/country.entity.js';
import { Department } from '../../domain/entities/department.entity.js';

describe('ListDepartmentsUseCase', () => {
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
  ): { useCase: ListDepartmentsUseCase; departmentRepository: DepartmentRepository } => {
    const countryRepository = {
      findById: jest.fn().mockResolvedValue(countryOverride),
      findAllActive: jest.fn(),
    } as unknown as CountryRepository;

    const departmentRepository = {
      findActiveByCountry: jest.fn().mockResolvedValue(departments),
      findById: jest.fn(),
    } as unknown as DepartmentRepository;

    return { useCase: new ListDepartmentsUseCase(countryRepository, departmentRepository), departmentRepository };
  };

  it('lists active departments for an existing active country', async () => {
    const { useCase, departmentRepository } = buildUseCase();

    const result = await useCase.execute('country-1');

    expect(departmentRepository.findActiveByCountry).toHaveBeenCalledWith('country-1');
    expect(result).toEqual([{ id: 'department-1', name: 'Antioquia', countryId: 'country-1' }]);
  });

  it('throws NotFoundException when the country does not exist', async () => {
    const { useCase } = buildUseCase(null);

    await expect(useCase.execute('missing-country')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the country is inactive', async () => {
    const { useCase } = buildUseCase({ ...country, isActive: false });

    await expect(useCase.execute('country-1')).rejects.toThrow(NotFoundException);
  });
});
