import { Injectable, NotFoundException } from '@nestjs/common';
import { CountryDao } from '../dao/country.dao.js';
import { DepartmentDao } from '../dao/department.dao.js';
import { DepartmentResponseDto } from '../dtos/department-response.dto.js';

/**
 * Servicio encargado de listar los departamentos o estados de un país específico.
 */
@Injectable()
export class ListDepartmentsService {
  constructor(
    private readonly countryDao: CountryDao,
    private readonly departmentDao: DepartmentDao,
  ) {}

  /**
   * Consulta los departamentos activos que pertenecen al país especificado.
   *
   * @param countryId Identificador UUID del país.
   * @returns Lista de departamentos asociados en formato DepartmentResponseDto.
   * @throws NotFoundException Si el país no existe o está inactivo.
   */
  async execute(countryId: string): Promise<DepartmentResponseDto[]> {
    const country = await this.countryDao.findById(countryId);
    if (!country?.isActive) {
      throw new NotFoundException('País no encontrado.');
    }

    const departments = await this.departmentDao.findActiveByCountry(countryId);
    return departments.map((department) => new DepartmentResponseDto(department));
  }
}
