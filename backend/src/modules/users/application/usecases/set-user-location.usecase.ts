import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CinemaRepository } from '../../../locations/infrastructure/dao/cinema.dao.js';
import { CityRepository } from '../../../locations/infrastructure/dao/city.dao.js';
import { CountryRepository } from '../../../locations/infrastructure/dao/country.dao.js';
import { DepartmentRepository } from '../../../locations/infrastructure/dao/department.dao.js';
import { UserLocationRepository } from '../../infrastructure/dao/user-location.repository.js';
import { SetUserLocationDto } from '../dtos/set-user-location.dto.js';
import { UserLocationResponseDto } from '../dtos/user-location-response.dto.js';

@Injectable()
export class SetUserLocationUseCase {
  constructor(
    private readonly countryRepository: CountryRepository,
    private readonly departmentRepository: DepartmentRepository,
    private readonly cityRepository: CityRepository,
    private readonly cinemaRepository: CinemaRepository,
    private readonly userLocationRepository: UserLocationRepository,
  ) {}

  async execute(dto: SetUserLocationDto): Promise<UserLocationResponseDto> {
    const country = await this.countryRepository.findById(dto.countryId);
    if (!country || !country.isActive) {
      throw new NotFoundException('País no encontrado.');
    }

    const department = await this.departmentRepository.findById(dto.departmentId);
    if (!department || !department.isActive) {
      throw new NotFoundException('Departamento no encontrado.');
    }
    if (department.countryId !== country.id) {
      throw new BadRequestException('El departamento no pertenece al país seleccionado.');
    }

    const city = await this.cityRepository.findById(dto.cityId);
    if (!city) {
      throw new NotFoundException('Ciudad no encontrada.');
    }
    if (city.departmentId !== department.id) {
      throw new BadRequestException('La ciudad no pertenece al departamento seleccionado.');
    }
    if (!city.isActive) {
      throw new BadRequestException('La ciudad seleccionada se encuentra inactiva.');
    }

    const activeCinemas = await this.cinemaRepository.countActiveByCity(city.id);
    if (activeCinemas === 0) {
      throw new BadRequestException('La ciudad seleccionada no tiene cines activos disponibles.');
    }

    const userLocation = await this.userLocationRepository.upsert(dto.userId, country.id, department.id, city.id);

    return new UserLocationResponseDto(userLocation, 'Ubicación guardada correctamente.');
  }
}
