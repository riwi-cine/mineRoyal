import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity/user.entity.js';
import { UsersService } from '../../users/users.service.js';
import { LocationsModule } from '../locations/locations.module.js';
import { SetUserLocationUseCase } from './application/services/set-user-location.usecase.js';
import { UserLocation } from './domain/entities/user-location.entity.js';
import { UserLocationRepository } from './infrastructure/dao/user-location.repository.js';
import { UsersController } from './ui/controllers/users.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserLocation, User]), LocationsModule],
  controllers: [UsersController],
  providers: [UserLocationRepository, SetUserLocationUseCase, UsersService],
  exports: [UserLocationRepository],
})
export class UsersModule {}
