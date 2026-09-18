import { ApiProperty } from '@nestjs/swagger';
import { CinemaFunction } from '../../domain/entities/function.entity.js';

class RoomSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() capacity!: number;
  @ApiProperty() extraPrice!: number;
}

class CinemaSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() cityId!: string;
}

class FunctionTypeSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ example: '2D', description: 'Formato de proyección (2D, 3D, IMAX, VIP, etc.)' })
  projection!: string;
  @ApiProperty() language!: string;
  @ApiProperty({ enum: ['DOBLADA', 'SUBTITULADA'] })
  audioType!: string;
}

/**
 * Función disponible para selección (HU-009), con los datos necesarios para
 * que el usuario elija fecha, complejo, sala, hora, formato, idioma y audio.
 */
export class FunctionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() movieId: string;
  @ApiProperty() startsAt: Date;
  @ApiProperty() active: boolean;
  @ApiProperty({ description: 'Precio base de la función, antes del recargo de sala (RN-037).' })
  basePrice: number;
  @ApiProperty({ type: RoomSummaryDto })
  room: RoomSummaryDto;
  @ApiProperty({ type: CinemaSummaryDto })
  cinema: CinemaSummaryDto;
  @ApiProperty({ type: FunctionTypeSummaryDto })
  functionType: FunctionTypeSummaryDto;

  constructor(cineFunction: CinemaFunction) {
    const room = cineFunction.room!;
    const cinema = room.cinema!;
    const functionType = cineFunction.functionType!;

    this.id = cineFunction.id;
    this.movieId = cineFunction.movieId;
    this.startsAt = cineFunction.startsAt;
    this.active = cineFunction.active;
    this.basePrice = Number(cineFunction.basePrice);
    this.room = { id: room.id, name: room.name, capacity: room.capacity, extraPrice: Number(room.extraPrice) };
    this.cinema = { id: cinema.id, name: cinema.name, cityId: cinema.cityId };
    this.functionType = {
      id: functionType.id,
      name: functionType.name,
      projection: functionType.projection,
      language: functionType.language,
      audioType: functionType.audioType,
    };
  }
}
