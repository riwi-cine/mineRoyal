import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Actor } from './entities/actor.entity.js';
import { Director } from './entities/director.entity.js';
import { Format } from './entities/format.entity.js';
import { Genre } from './entities/genre.entity.js';
import { Language } from './entities/language.entity.js';
import { Movie } from './entities/movie.entity.js';
import { MovieActor } from './entities/movie-actor.entity.js';
import { MovieFormat } from './entities/movie-format.entity.js';
import { MovieFunction } from './entities/movie-function.entity.js';
import { MovieGenre } from './entities/movie-genre.entity.js';
import { MovieLanguage } from './entities/movie-language.entity.js';
import { Room } from './entities/room.entity.js';
import { MovieFunctionDao } from './dao/movie-function.dao.js';
import { MovieDao } from './dao/movie.dao.js';
import { GetMovieDetailService } from './services/get-movie-detail.service.js';
import { ListMovieFunctionsService } from './services/list-movie-functions.service.js';
import { ListMovieRecommendationsService } from './services/list-movie-recommendations.service.js';
import { MoviesController } from './controllers/movies.controller.js';
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
    MovieDao,
    MovieFunctionDao,
    GetMovieDetailService,
    ListMovieFunctionsService,
    ListMovieRecommendationsService,
  ],
  exports: [MovieDao, MovieFunctionDao],
})
export class MoviesModule {}
