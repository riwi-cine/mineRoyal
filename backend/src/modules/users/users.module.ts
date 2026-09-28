import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsModule } from '../locations/locations.module.js';
import { Membership } from './domain/entities/membership.entity.js';
import { UserLocation } from './domain/entities/user-location.entity.js';
import { MembershipRepository } from './infrastructure/dao/membership.repository.js';
import { UserLocationRepository } from './infrastructure/dao/user-location.repository.js';
import { SetUserLocationService } from './application/services/set-user-location.service.js';
import { UsersController } from './ui/controllers/users.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserLocation, Membership]), LocationsModule],
  controllers: [UsersController],
  providers: [UserLocationRepository, MembershipRepository, SetUserLocationService],
  exports: [UserLocationRepository, MembershipRepository],
})
export class UsersModule {}
