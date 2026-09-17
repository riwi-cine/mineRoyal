import { ApiProperty } from '@nestjs/swagger';
import { MovieFormat } from '../../domain/entities/movie-format.entity.js';

export class MovieFormatResponseDto {
  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  id: string;

  @ApiProperty({ example: '2D' })
  name: string;

  @ApiProperty({ example: 15000 })
  price: number;

  constructor(movieFormat: MovieFormat) {
    this.id = movieFormat.format?.id ?? movieFormat.formatId;
    this.name = movieFormat.format?.name ?? '';
    this.price = movieFormat.price;
  }
}
