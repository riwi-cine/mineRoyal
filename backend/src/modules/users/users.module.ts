import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsModule } from '../locations/locations.module.js';
import { Membership } from './entities/membership.entity.js';
import { UserLocation } from './entities/user-location.entity.js';
import { MembershipDao } from './dao/membership.dao.js';
import { UserLocationDao } from './dao/user-location.dao.js';
import { SetUserLocationService } from './services/set-user-location.service.js';
import { UsersController } from './controllers/users.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserLocation, Membership]), LocationsModule],
  controllers: [UsersController],
  providers: [UserLocationDao, MembershipDao, SetUserLocationService],
  exports: [UserLocationDao, MembershipDao],
})
export class UsersModule {}
