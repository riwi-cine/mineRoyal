import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsModule } from '../locations/locations.module.js';
import { UserLocation } from './domain/entities/user-location.entity.js';
import { UserLocationRepository } from './infrastructure/dao/user-location.repository.js';
import { SetUserLocationUseCase } from './application/services/set-user-location.usecase.js';
import { UsersController } from './ui/controllers/users.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserLocation]), LocationsModule],
  controllers: [UsersController],
  providers: [UserLocationRepository, SetUserLocationUseCase],
  exports: [UserLocationRepository],
})
export class UsersModule {}
