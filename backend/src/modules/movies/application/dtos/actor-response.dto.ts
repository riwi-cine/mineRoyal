import { ApiProperty } from '@nestjs/swagger';
import { Actor } from '../../domain/entities/actor.entity.js';

export class ActorResponseDto {
  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  id: string;

  @ApiProperty({ example: 'Cillian Murphy' })
  name: string;

  constructor(actor: Actor) {
    this.id = actor.id;
    this.name = actor.name;
  }
}
