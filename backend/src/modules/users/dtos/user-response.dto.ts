import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../entities/user.entity.js';

export class UserResponseDto {
  @ApiProperty({ example: 42, type: Number })
  id: number;

  @ApiProperty({ example: 'Ana Pérez' })
  name: string;

  @ApiProperty({ example: 'ana@example.com' })
  email: string;

  @ApiProperty({ example: '2026-10-05T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-05T12:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: null, nullable: true, description: 'Fecha de eliminación lógica.' })
  deletedAt: Date | null;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.deletedAt = user.deletedAt ?? null;
  }
}
