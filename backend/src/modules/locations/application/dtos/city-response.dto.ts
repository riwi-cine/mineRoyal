import { ApiProperty } from '@nestjs/swagger';
import { City } from '../../domain/entities/city.entity.js';

export class CityResponseDto {
  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  id: string;

  @ApiProperty({ example: 'Medellín' })
  name: string;

  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  departmentId: string;

  constructor(city: City) {
    this.id = city.id;
    this.name = city.name;
    this.departmentId = city.departmentId;
  }
}
