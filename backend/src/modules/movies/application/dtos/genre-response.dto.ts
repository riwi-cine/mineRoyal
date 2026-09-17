import { ApiProperty } from '@nestjs/swagger';
import { Genre } from '../../domain/entities/genre.entity.js';

export class GenreResponseDto {
  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  id: string;

  @ApiProperty({ example: 'Ciencia Ficción' })
  name: string;

  constructor(genre: Genre) {
    this.id = genre.id;
    this.name = genre.name;
  }
}
