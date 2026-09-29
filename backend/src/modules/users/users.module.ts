import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsModule } from '../locations/locations.module.js';
import { UserLocation } from './entities/user-location.entity.js';
import { UserLocationDao } from './dao/user-location.dao.js';
import { SetUserLocationService } from './services/set-user-location.service.js';
import { UsersController } from './controllers/users.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserLocation]), LocationsModule],
  controllers: [UsersController],
  providers: [UserLocationDao, SetUserLocationService],
  exports: [UserLocationDao],
})
export class UsersModule {}
