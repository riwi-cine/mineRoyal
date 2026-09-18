import { Injectable, NotFoundException } from '@nestjs/common';
import { CountryRepository } from '../../infrastructure/dao/country.dao.js';
import { DepartmentRepository } from '../../infrastructure/dao/department.dao.js';
import { DepartmentResponseDto } from '../dtos/department-response.dto.js';

@Injectable()
export class ListDepartmentsUseCase {
  constructor(
    private readonly countryRepository: CountryRepository,
    private readonly departmentRepository: DepartmentRepository,
  ) {}

  async execute(countryId: string): Promise<DepartmentResponseDto[]> {
    const country = await this.countryRepository.findById(countryId);
    if (!country || !country.isActive) {
      throw new NotFoundException('País no encontrado.');
    }

    const departments = await this.departmentRepository.findActiveByCountry(countryId);
    return departments.map((department) => new DepartmentResponseDto(department));
  }
}
