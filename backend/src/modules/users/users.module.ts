import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsModule } from '../locations/locations.module.js';
import { Membership } from './entities/membership.entity.js';
import { UserLocation } from './entities/user-location.entity.js';
import { User } from './entities/user.entity.js';
import { MembershipDao } from './dao/membership.dao.js';
import { UserLocationDao } from './dao/user-location.dao.js';
import { UserDao } from './dao/user.dao.js';
import { SetUserLocationService } from './services/set-user-location.service.js';
import { UsersService } from './services/users.service.js';
import { UsersController } from './controllers/users.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserLocation, Membership]), LocationsModule],
  controllers: [UsersController],
  providers: [UserDao, UserLocationDao, MembershipDao, UsersService, SetUserLocationService],
  exports: [UserDao, UserLocationDao, MembershipDao, UsersService],
})
export class UsersModule {}
