import { Injectable, NotFoundException } from '@nestjs/common';
import { CityDao } from '../dao/city.dao.js';
import { DepartmentDao } from '../dao/department.dao.js';
import { CityResponseDto } from '../dtos/city-response.dto.js';

@Injectable()
export class ListCitiesService {
  constructor(
    private readonly departmentDao: DepartmentDao,
    private readonly cityDao: CityDao,
  ) {}

  async execute(departmentId: string): Promise<CityResponseDto[]> {
    const department = await this.departmentDao.findById(departmentId);
    if (!department || !department.isActive) {
      throw new NotFoundException('Departamento no encontrado.');
    }

    const cities = await this.cityDao.findActiveByDepartment(departmentId);
    return cities.map((city) => new CityResponseDto(city));
  }
}
