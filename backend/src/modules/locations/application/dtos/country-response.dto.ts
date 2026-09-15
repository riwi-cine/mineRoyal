import { ApiProperty } from '@nestjs/swagger';
import { Country } from '../../domain/entities/country.entity.js';

export class CountryResponseDto {
  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  id: string;

  @ApiProperty({ example: 'Colombia' })
  name: string;

  @ApiProperty({ example: 'CO' })
  isoCode: string;

  constructor(country: Country) {
    this.id = country.id;
    this.name = country.name;
    this.isoCode = country.isoCode;
  }
}
