import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CinemaDao } from '../../locations/dao/cinema.dao.js';
import { CityDao } from '../../locations/dao/city.dao.js';
import { CountryDao } from '../../locations/dao/country.dao.js';
import { DepartmentDao } from '../../locations/dao/department.dao.js';
import { UserLocationDao } from '../dao/user-location.dao.js';
import { SetUserLocationDto } from '../dtos/set-user-location.dto.js';
import { UserLocationResponseDto } from '../dtos/user-location-response.dto.js';

@Injectable()
export class SetUserLocationService {
  constructor(
    private readonly countryDao: CountryDao,
    private readonly departmentDao: DepartmentDao,
    private readonly cityDao: CityDao,
    private readonly cinemaDao: CinemaDao,
    private readonly userLocationDao: UserLocationDao,
  ) {}

  async execute(dto: SetUserLocationDto): Promise<UserLocationResponseDto> {
    const country = await this.countryDao.findById(dto.countryId);
    if (!country || !country.isActive) {
      throw new NotFoundException('País no encontrado.');
    }

    const department = await this.departmentDao.findById(dto.departmentId);
    if (!department || !department.isActive) {
      throw new NotFoundException('Departamento no encontrado.');
    }
    if (department.countryId !== country.id) {
      throw new BadRequestException('El departamento no pertenece al país seleccionado.');
    }

    const city = await this.cityDao.findById(dto.cityId);
    if (!city) {
      throw new NotFoundException('Ciudad no encontrada.');
    }
    if (city.departmentId !== department.id) {
      throw new BadRequestException('La ciudad no pertenece al departamento seleccionado.');
    }
    if (!city.isActive) {
      throw new BadRequestException('La ciudad seleccionada se encuentra inactiva.');
    }

    const activeCinemas = await this.cinemaDao.countActiveByCity(city.id);
    if (activeCinemas === 0) {
      throw new BadRequestException('La ciudad seleccionada no tiene cines activos disponibles.');
    }

    const userLocation = await this.userLocationDao.upsert(dto.userId, country.id, department.id, city.id);

    return new UserLocationResponseDto(userLocation, 'Ubicación guardada correctamente.');
  }
}
