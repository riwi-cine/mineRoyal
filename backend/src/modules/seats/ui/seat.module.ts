import Module from '@nestjs/common';
import TypeOrmModule from '@nestjs/typeorm';
import {Seats} from '../domain/entities/seat.entity.js';
import {SeatLock} from '../domain/entities/seat-lock.entity.js';
import {SeatRepository} from '../infrastructure/dao/seat.dao.js';
import {SeatController} from './controllers/seat.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Seats, SeatLock])],
  controllers: [SeatController],
  providers: [SeatRepository],
  exports: [SeatRepository],
})
export class SeatModule {}
