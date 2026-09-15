import { Injectable } from '@nestjs/common';
import { CountryRepository } from '../../infrastructure/dao/country.repository.js';
import { CountryResponseDto } from '../dtos/country-response.dto.js';

@Injectable()
export class ListCountriesUseCase {
  constructor(private readonly countryRepository: CountryRepository) {}

  async execute(): Promise<CountryResponseDto[]> {
    const countries = await this.countryRepository.findAllActive();
    return countries.map((country) => new CountryResponseDto(country));
  }
}
