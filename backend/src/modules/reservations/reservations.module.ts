import { Module } from '@nestjs/common';
import { SeatModule } from '../seats/seat.module.js';
import { ReservationsController } from './controllers/reservations.controller.js';

@Module({
  imports: [SeatModule],
  controllers: [ReservationsController],
})
export class ReservationsModule {}
