import { Injectable } from '@nestjs/common';
import { CountryDao } from '../dao/country.dao.js';
import { CountryResponseDto } from '../dtos/country-response.dto.js';

@Injectable()
export class ListCountriesService {
  constructor(private readonly countryDao: CountryDao) {}

  async execute(): Promise<CountryResponseDto[]> {
    const countries = await this.countryDao.findAllActive();
    return countries.map((country) => new CountryResponseDto(country));
  }
}
