import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Actor } from './domain/entities/actor.entity.js';
import { Director } from './domain/entities/director.entity.js';
import { Format } from './domain/entities/format.entity.js';
import { Genre } from './domain/entities/genre.entity.js';
import { Language } from './domain/entities/language.entity.js';
import { Movie } from './domain/entities/movie.entity.js';
import { MovieActor } from './domain/entities/movie-actor.entity.js';
import { MovieFormat } from './domain/entities/movie-format.entity.js';
import { MovieFunction } from './domain/entities/movie-function.entity.js';
import { MovieGenre } from './domain/entities/movie-genre.entity.js';
import { MovieLanguage } from './domain/entities/movie-language.entity.js';
import { Room } from './domain/entities/room.entity.js';
import { MovieFunctionRepository } from './infrastructure/dao/movie-function.repository.js';
import { MovieRepository } from './infrastructure/dao/movie.repository.js';
import { GetMovieDetailUseCase } from './application/services/get-movie-detail.usecase.js';
import { ListMovieFunctionsUseCase } from './application/services/list-movie-functions.usecase.js';
import { ListMovieRecommendationsUseCase } from './application/services/list-movie-recommendations.usecase.js';
import { MoviesController } from './ui/controllers/movies.controller.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Movie,
      Director,
      Genre,
      Actor,
      Language,
      Format,
      MovieGenre,
      MovieActor,
      MovieLanguage,
      MovieFormat,
      Room,
      MovieFunction,
    ]),
    UsersModule,
  ],
  controllers: [MoviesController],
  providers: [
    MovieRepository,
    MovieFunctionRepository,
    GetMovieDetailUseCase,
    ListMovieFunctionsUseCase,
    ListMovieRecommendationsUseCase,
  ],
  exports: [MovieRepository, MovieFunctionRepository],
})
export class MoviesModule {}
