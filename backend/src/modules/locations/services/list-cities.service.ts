import { Injectable, NotFoundException } from '@nestjs/common';
import { CityDao } from '../dao/city.dao.js';
import { DepartmentDao } from '../dao/department.dao.js';
import { CityResponseDto } from '../dtos/city-response.dto.js';

/**
 * Servicio encargado de listar las ciudades pertenecientes a un departamento o estado.
 */
@Injectable()
export class ListCitiesService {
  constructor(
    private readonly departmentDao: DepartmentDao,
    private readonly cityDao: CityDao,
  ) {}

  /**
   * Consulta las ciudades activas asociadas al departamento indicado.
   *
   * @param departmentId Identificador UUID del departamento.
   * @returns Lista de ciudades activas en formato CityResponseDto.
   * @throws NotFoundException Si el departamento no existe o está inactivo.
   */
  async execute(departmentId: string): Promise<CityResponseDto[]> {
    const department = await this.departmentDao.findById(departmentId);
    if (!department || !department.isActive) {
      throw new NotFoundException('Departamento no encontrado.');
    }

    const cities = await this.cityDao.findActiveByDepartment(departmentId);
    return cities.map((city) => new CityResponseDto(city));
  }
}
