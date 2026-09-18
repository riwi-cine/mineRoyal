import { ApiProperty } from '@nestjs/swagger';
import { Language } from '../../domain/entities/language.entity.js';

export class LanguageResponseDto {
  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  id: string;

  @ApiProperty({ example: 'Español' })
  name: string;

  constructor(language: Language) {
    this.id = language.id;
    this.name = language.name;
  }
}
