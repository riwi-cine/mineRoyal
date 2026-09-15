import { ApiProperty } from '@nestjs/swagger';
import { Movie } from '../../domain/entities/movie.entity.js';
import { ActorResponseDto } from './actor-response.dto.js';
import { DirectorResponseDto } from './director-response.dto.js';
import { GenreResponseDto } from './genre-response.dto.js';
import { LanguageResponseDto } from './language-response.dto.js';
import { MovieFormatResponseDto } from './movie-format-response.dto.js';

export class MovieDetailResponseDto {
  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  id: string;

  @ApiProperty({ example: 'Oppenheimer' })
  title: string;

  @ApiProperty({ example: 'https://cdn.example.com/posters/oppenheimer.jpg', nullable: true })
  posterUrl?: string;

  @ApiProperty({ example: 'https://cdn.example.com/banners/oppenheimer.jpg', nullable: true })
  bannerUrl?: string;

  @ApiProperty({ example: 'https://www.youtube.com/embed/d9MyW72ELq0', nullable: true })
  trailerUrl?: string;

  @ApiProperty({ example: 'La historia del padre de la bomba atómica.' })
  synopsis: string;

  @ApiProperty({ example: 180 })
  durationMinutes: number;

  @ApiProperty({ example: 'A' })
  classification: string;

  @ApiProperty({ example: '2023-07-21' })
  releaseDate: string;

  @ApiProperty({ example: 8.6 })
  rating: number;

  @ApiProperty({ type: DirectorResponseDto })
  director: DirectorResponseDto;

  @ApiProperty({ type: [GenreResponseDto] })
  genres: GenreResponseDto[];

  @ApiProperty({ type: [ActorResponseDto] })
  actors: ActorResponseDto[];

  @ApiProperty({ type: [LanguageResponseDto] })
  languages: LanguageResponseDto[];

  @ApiProperty({ type: [MovieFormatResponseDto], description: 'Formatos disponibles y su valor de entrada.' })
  formats: MovieFormatResponseDto[];

  constructor(movie: Movie) {
    this.id = movie.id;
    this.title = movie.title;
    this.posterUrl = movie.posterUrl;
    this.bannerUrl = movie.bannerUrl;
    this.trailerUrl = movie.trailerUrl;
    this.synopsis = movie.synopsis;
    this.durationMinutes = movie.durationMinutes;
    this.classification = movie.classification;
    this.releaseDate = movie.releaseDate.toISOString().slice(0, 10);
    this.rating = movie.rating;
    this.director = movie.director ? new DirectorResponseDto(movie.director) : createdDirector(movie.directorId);
    this.genres = (movie.movieGenres ?? []).filter((mg) => mg.genre).map((mg) => new GenreResponseDto(mg.genre!));
    this.actors = (movie.movieActors ?? []).filter((ma) => ma.actor).map((ma) => new ActorResponseDto(ma.actor!));
    this.languages = (movie.movieLanguages ?? [])
      .filter((ml) => ml.language)
      .map((ml) => new LanguageResponseDto(ml.language!));
    this.formats = (movie.movieFormats ?? []).filter((mf) => mf.format).map((mf) => new MovieFormatResponseDto(mf));
  }
}

function createdDirector(directorId: string): DirectorResponseDto {
  return { id: directorId, name: '' } as DirectorResponseDto;
}
