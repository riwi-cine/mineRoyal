import { ApiProperty } from '@nestjs/swagger';
import { Format } from '../../domain/entities/format.entity.js';

export class FormatResponseDto {
  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  id: string;

  @ApiProperty({ example: 'IMAX' })
  name: string;

  constructor(format: Format) {
    this.id = format.id;
    this.name = format.name;
  }
}
