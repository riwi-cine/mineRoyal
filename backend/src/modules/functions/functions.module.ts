import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../movies/entities/movie.entity.js';
import { CinemaFunction } from './entities/function.entity.js';
import { FunctionType } from './entities/function-type.entity.js';
import { FunctionDao } from './dao/function.dao.js';
import { GetFunctionPricesService } from './services/get-function-prices.service.js';
import { GetFunctionService } from './services/get-function.service.js';
import { ListMovieFunctionsService } from './services/list-movie-functions.service.js';
import { FunctionsController } from './controllers/functions.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([CinemaFunction, FunctionType, Movie])],
  controllers: [FunctionsController],
  providers: [FunctionDao, ListMovieFunctionsService, GetFunctionService, GetFunctionPricesService],
  exports: [FunctionDao],
})
export class FunctionsModule {}
