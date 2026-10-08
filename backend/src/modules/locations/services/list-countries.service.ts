import { Injectable } from '@nestjs/common';
import { CountryDao } from '../dao/country.dao.js';
import { CountryResponseDto } from '../dtos/country-response.dto.js';

/**
 * Servicio encargado de listar los países activos disponibles en el sistema.
 */
@Injectable()
export class ListCountriesService {
  constructor(private readonly countryDao: CountryDao) {}

  /**
   * Consulta todos los países habilitados con sus respectivas monedas.
   *
   * @returns Lista de países en formato CountryResponseDto.
   */
  async execute(): Promise<CountryResponseDto[]> {
    const countries = await this.countryDao.findAllActive();
    return countries.map((country) => new CountryResponseDto(country));
  }
}
