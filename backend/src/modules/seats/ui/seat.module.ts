import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CinemaFunction } from '../../functions/domain/entities/function.entity.js';
import { Ticket } from '../../cart/domain/entities/ticket.entity.js';
import { Seats } from '../domain/entities/seat.entity.js';
import { SeatLock } from '../domain/entities/seat-lock.entity.js';
import { Room } from '../domain/entities/room.entity.js';
import { RoomType } from '../domain/entities/room-type.entity.js';
import { SeatRepository } from '../infrastructure/dao/seat.dao.js';
import { SeatService } from '../application/services/seat.service.js';
import { SeatController } from './controllers/seat.controller.js';
import { FunctionSeatsController } from './controllers/function-seats.controller.js';
import { ReservationsController } from '../../reservations/ui/controllers/reservations.controller.js';

@Module({
  // Room/RoomType are registered here (not just referenced via relations) so TypeORM's
  // autoLoadEntities can build their metadata — without it, `relations: ['room']` queries
  // in SeatRepository fail at bootstrap since Room was never registered by any module.
  imports: [TypeOrmModule.forFeature([Seats, SeatLock, CinemaFunction, Ticket, Room, RoomType])],
  controllers: [SeatController, FunctionSeatsController, ReservationsController],
  providers: [SeatRepository, SeatService],
  exports: [SeatRepository, SeatService],
})
export class SeatModule {}
