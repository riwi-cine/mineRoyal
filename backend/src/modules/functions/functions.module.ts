import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../movies/domain/entities/movie.entity.js';
import { CinemaFunction } from './domain/entities/function.entity.js';
import { FunctionType } from './domain/entities/function-type.entity.js';
import { FunctionRepository } from './infrastructure/dao/function.dao.js';
import { GetFunctionPricesService } from './application/services/get-function-prices.service.js';
import { GetFunctionService } from './application/services/get-function.service.js';
import { ListMovieFunctionsService } from './application/services/list-movie-functions.service.js';
import { FunctionsController } from './ui/controllers/functions.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([CinemaFunction, FunctionType, Movie])],
  controllers: [FunctionsController],
  providers: [FunctionRepository, ListMovieFunctionsService, GetFunctionService, GetFunctionPricesService],
  exports: [FunctionRepository],
})
export class FunctionsModule {}