import { ApiProperty } from '@nestjs/swagger';
import { Movie } from '../../domain/entities/movie.entity.js';
import { GenreResponseDto } from './genre-response.dto.js';

export class MovieSummaryResponseDto {
  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  id: string;

  @ApiProperty({ example: 'Oppenheimer' })
  title: string;

  @ApiProperty({ example: 'https://cdn.example.com/posters/oppenheimer.jpg', nullable: true })
  posterUrl?: string;

  @ApiProperty({ example: 8.6 })
  rating: number;

  @ApiProperty({ type: [GenreResponseDto] })
  genres: GenreResponseDto[];

  constructor(movie: Movie) {
    this.id = movie.id;
    this.title = movie.title;
    this.posterUrl = movie.posterUrl;
    this.rating = movie.rating;
    this.genres = (movie.movieGenres ?? []).filter((mg) => mg.genre).map((mg) => new GenreResponseDto(mg.genre!));
  }
}
