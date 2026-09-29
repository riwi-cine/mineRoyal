import { NotFoundException } from '@nestjs/common';
import { ListCitiesService } from './list-cities.service.js';
import { CityDao } from '../dao/city.dao.js';
import { DepartmentDao } from '../dao/department.dao.js';
import { City } from '../entities/city.entity.js';
import { Department } from '../entities/department.entity.js';

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

  const buildService = (
    departmentOverride: Department | null = department,
    cities: City[] = [city],
  ): { service: ListCitiesService; cityDao: CityDao } => {
    const departmentDao = {
      findById: vi.fn().mockResolvedValue(departmentOverride),
      findActiveByCountry: vi.fn(),
    } as unknown as DepartmentDao;

    const cityDao = {
      findActiveByDepartment: vi.fn().mockResolvedValue(cities),
      findById: vi.fn(),
    } as unknown as CityDao;

    return { service: new ListCitiesService(departmentDao, cityDao), cityDao };
  };

  it('lists active cities for an existing active department', async () => {
    const { service, cityDao } = buildService();

    const result = await service.execute('department-1');

    expect(cityDao.findActiveByDepartment).toHaveBeenCalledWith('department-1');
    expect(result).toEqual([{ id: 'city-1', name: 'Medellín', departmentId: 'department-1' }]);
  });

  it('throws NotFoundException when the department does not exist', async () => {
    const { service } = buildService(null);

    await expect(service.execute('missing-department')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the department is inactive', async () => {
    const { service } = buildService({ ...department, isActive: false });

    await expect(service.execute('department-1')).rejects.toThrow(NotFoundException);
  });
});
