import { Injectable } from '@nestjs/common';
import { CountryRepository } from '../../infrastructure/dao/country.dao.js';
import { CountryResponseDto } from '../dtos/country-response.dto.js';

@Injectable()
export class ListCountriesService {
  constructor(private readonly countryRepository: CountryRepository) {}

  async execute(): Promise<CountryResponseDto[]> {
    const countries = await this.countryRepository.findAllActive();
    return countries.map((country) => new CountryResponseDto(country));
  }
}