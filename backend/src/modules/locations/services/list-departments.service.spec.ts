import { NotFoundException } from '@nestjs/common';
import { ListDepartmentsService } from './list-departments.service.js';
import { CountryDao } from '../dao/country.dao.js';
import { DepartmentDao } from '../dao/department.dao.js';
import { Country } from '../entities/country.entity.js';
import { Department } from '../entities/department.entity.js';

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

  const buildService = (
    countryOverride: Country | null = country,
    departments: Department[] = [department],
  ): { service: ListDepartmentsService; departmentDao: DepartmentDao } => {
    const countryDao = {
      findById: vi.fn().mockResolvedValue(countryOverride),
      findAllActive: vi.fn(),
    } as unknown as CountryDao;

    const departmentDao = {
      findActiveByCountry: vi.fn().mockResolvedValue(departments),
      findById: vi.fn(),
    } as unknown as DepartmentDao;

    return { service: new ListDepartmentsService(countryDao, departmentDao), departmentDao };
  };

  it('lists active departments for an existing active country', async () => {
    const { service, departmentDao } = buildService();

    const result = await service.execute('country-1');

    expect(departmentDao.findActiveByCountry).toHaveBeenCalledWith('country-1');
    expect(result).toEqual([{ id: 'department-1', name: 'Antioquia', countryId: 'country-1' }]);
  });

  it('throws NotFoundException when the country does not exist', async () => {
    const { service } = buildService(null);

    await expect(service.execute('missing-country')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the country is inactive', async () => {
    const { service } = buildService({ ...country, isActive: false });

    await expect(service.execute('country-1')).rejects.toThrow(NotFoundException);
  });
});
