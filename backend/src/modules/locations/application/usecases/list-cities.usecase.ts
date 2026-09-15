import { Injectable, NotFoundException } from '@nestjs/common';
import { CityRepository } from '../../infrastructure/dao/city.repository.js';
import { DepartmentRepository } from '../../infrastructure/dao/department.repository.js';
import { CityResponseDto } from '../dtos/city-response.dto.js';

@Injectable()
export class ListCitiesUseCase {
  constructor(
    private readonly departmentRepository: DepartmentRepository,
    private readonly cityRepository: CityRepository,
  ) {}

  async execute(departmentId: string): Promise<CityResponseDto[]> {
    const department = await this.departmentRepository.findById(departmentId);
    if (!department || !department.isActive) {
      throw new NotFoundException('Departamento no encontrado.');
    }

    const cities = await this.cityRepository.findActiveByDepartment(departmentId);
    return cities.map((city) => new CityResponseDto(city));
  }
}
