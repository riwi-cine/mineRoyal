import { ApiProperty } from '@nestjs/swagger';
import { Department } from '../../domain/entities/department.entity.js';

export class DepartmentResponseDto {
  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  id: string;

  @ApiProperty({ example: 'Antioquia' })
  name: string;

  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  countryId: string;

  constructor(department: Department) {
    this.id = department.id;
    this.name = department.name;
    this.countryId = department.countryId;
  }
}
