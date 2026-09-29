import { Injectable, NotFoundException } from '@nestjs/common';
import { CountryDao } from '../dao/country.dao.js';
import { DepartmentDao } from '../dao/department.dao.js';
import { DepartmentResponseDto } from '../dtos/department-response.dto.js';

@Injectable()
export class ListDepartmentsService {
  constructor(
    private readonly countryDao: CountryDao,
    private readonly departmentDao: DepartmentDao,
  ) {}

  async execute(countryId: string): Promise<DepartmentResponseDto[]> {
    const country = await this.countryDao.findById(countryId);
    if (!country || !country.isActive) {
      throw new NotFoundException('País no encontrado.');
    }

    const departments = await this.departmentDao.findActiveByCountry(countryId);
    return departments.map((department) => new DepartmentResponseDto(department));
  }
}
