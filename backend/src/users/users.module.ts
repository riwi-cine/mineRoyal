import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { typeOrmConfig } from '../config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {User} from './entities/user.entity/user.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature( [User])
  ],    
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
