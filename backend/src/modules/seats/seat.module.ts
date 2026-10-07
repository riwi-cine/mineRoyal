import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CinemaFunction } from '../functions/entities/function.entity.js';
import { Ticket } from '../cart/entities/ticket.entity.js';
import { Seats } from './entities/seat.entity.js';
import { SeatLock } from './entities/seat-lock.entity.js';
import { Room } from './entities/room.entity.js';
import { RoomType } from './entities/room-type.entity.js';
import { SeatDao } from './dao/seat.dao.js';
import { SeatService } from './services/seat.service.js';
import { SeatController } from './controllers/seat.controller.js';
import { FunctionSeatsController } from './controllers/function-seats.controller.js';
import { ReservationsController } from '../reservations/controllers/reservations.controller.js';

@Module({
  // Room/RoomType are registered here (not just referenced via relations) so TypeORM's
  // autoLoadEntities can build their metadata — without it, `relations: ['room']` queries
  // in SeatDao fail at bootstrap since Room was never registered by any module.
  imports: [TypeOrmModule.forFeature([Seats, SeatLock, CinemaFunction, Ticket, Room, RoomType])],
  controllers: [SeatController, FunctionSeatsController, ReservationsController],
  providers: [SeatDao, SeatService],
  exports: [SeatDao, SeatService],
})
export class SeatModule {}
