import { ApiProperty } from '@nestjs/swagger';
import { Director } from '../../domain/entities/director.entity.js';

export class DirectorResponseDto {
  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  id: string;

  @ApiProperty({ example: 'Christopher Nolan' })
  name: string;

  constructor(director: Director) {
    this.id = director.id;
    this.name = director.name;
  }
}
