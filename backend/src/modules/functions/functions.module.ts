import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../movies/domain/entities/movie.entity.js';
import { CinemaFunction } from './domain/entities/function.entity.js';
import { FunctionType } from './domain/entities/function-type.entity.js';
import { FunctionRepository } from './infrastructure/dao/function.dao.js';
import { GetFunctionPricesUseCase } from './application/services/get-function-prices.usecase.js';
import { GetFunctionUseCase } from './application/services/get-function.usecase.js';
import { ListMovieFunctionsUseCase } from './application/services/list-movie-functions.usecase.js';
import { FunctionsController } from './ui/controllers/functions.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([CinemaFunction, FunctionType, Movie])],
  controllers: [FunctionsController],
  providers: [FunctionRepository, ListMovieFunctionsUseCase, GetFunctionUseCase, GetFunctionPricesUseCase],
  exports: [FunctionRepository],
})
export class FunctionsModule {}
