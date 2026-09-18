import { ApiProperty } from '@nestjs/swagger';
import { MovieFunction } from '../../domain/entities/movie-function.entity.js';

class FunctionCinemaDto {
  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  id: string;

  @ApiProperty({ example: 'Cine Royal Medellín' })
  name: string;
}

class FunctionCityDto {
  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  id: string;

  @ApiProperty({ example: 'Medellín' })
  name: string;
}

class FunctionRoomDto {
  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  id: string;

  @ApiProperty({ example: 'Sala 1' })
  name: string;
}

class FunctionFormatDto {
  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  id: string;

  @ApiProperty({ example: '2D' })
  name: string;
}

export class MovieFunctionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  movieId: string;

  @ApiProperty({ example: '2026-09-20T18:00:00.000Z' })
  startsAt: string;

  @ApiProperty({ example: '2026-09-20' })
  date: string;

  @ApiProperty({ example: '18:00' })
  time: string;

  @ApiProperty({ example: 15000 })
  ticketPrice: number;

  @ApiProperty({ example: 50 })
  totalSeats: number;

  @ApiProperty({ example: 30 })
  availableSeats: number;

  @ApiProperty({ example: true })
  available: boolean;

  @ApiProperty({ example: false })
  soldOut: boolean;

  @ApiProperty()
  cinema: FunctionCinemaDto;

  @ApiProperty()
  city: FunctionCityDto;

  @ApiProperty()
  room: FunctionRoomDto;

  @ApiProperty()
  format: FunctionFormatDto;

  constructor(fn: MovieFunction) {
    this.id = fn.id;
    this.movieId = fn.movieId;
    this.startsAt = fn.startsAt.toISOString();
    this.date = fn.startsAt.toISOString().slice(0, 10);
    this.time = fn.startsAt.toISOString().slice(11, 16);
    this.ticketPrice = fn.ticketPrice;
    this.totalSeats = fn.totalSeats;
    this.availableSeats = fn.availableSeats;
    this.available = fn.availableSeats > 0;
    this.soldOut = fn.availableSeats === 0;
    this.cinema = fn.cinema ? { id: fn.cinema.id, name: fn.cinema.name } : { id: fn.cinemaId, name: '' };
    this.city = fn.cinema?.city
      ? { id: fn.cinema.city.id, name: fn.cinema.city.name }
      : { id: fn.cinema?.cityId ?? '', name: '' };
    this.room = fn.room ? { id: fn.room.id, name: fn.room.name } : { id: fn.roomId, name: '' };
    this.format = fn.format ? { id: fn.format.id, name: fn.format.name } : { id: fn.formatId, name: '' };
  }
}
