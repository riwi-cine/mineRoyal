import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsModule } from '../locations/locations.module.js';
import { SetUserLocationUseCase } from './application/services/set-user-location.usecase.js';
import { UsersService } from './application/services/users.service.js';
import { UserLocation } from './domain/entities/user-location.entity.js';
import { User } from './domain/entities/user.entity.js';
import { UserLocationRepository } from './infrastructure/dao/user-location.repository.js';
import { UsersController } from './ui/controllers/users.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserLocation, User]), LocationsModule],
  controllers: [UsersController],
  providers: [UserLocationRepository, SetUserLocationUseCase, UsersService],
  exports: [UserLocationRepository],
})
export class UsersModule {}
