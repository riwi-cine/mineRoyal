import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from './infrastructure/redis/redis.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { typeOrmConfig } from './config/database.config.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { FunctionsModule } from './modules/functions/functions.module.js';
import { LocationsModule } from './modules/locations/locations.module.js';
import { MoviesModule } from './modules/movies/movies.module.js';
import { SeatModule } from './modules/seats/seat.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { HealthModule } from './infrastructure/web/health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    RedisModule,
    AuthModule,
    LocationsModule,
    MoviesModule,
    UsersModule,
    SeatModule,
    FunctionsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
