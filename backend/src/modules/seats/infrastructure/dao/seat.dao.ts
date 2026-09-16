import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { CinemaFunction } from '../../../functions/domain/entities/function.entity.js';
import { Ticket } from '../../../cart/domain/entities/ticket.entity.js';
import { Seats } from '../../domain/entities/seat.entity.js';
import { SeatLock } from '../../domain/entities/seat-lock.entity.js';

/**
 * Ticket statuses that leave a seat definitively occupied.
 * Any ticket in one of these statuses makes the seat "Sold".
 */
const OCCUPYING_TICKET_STATUSES = ['SOLD', 'PAID', 'USED', 'SCANNED'];

/**
 * Seats repository (HU-010)
 * --------------------------
 * Sole layer responsible for talking to TypeORM for the room's seat map
 * and for the lifecycle of temporary locks (`seat_locks`).
 */
@Injectable()
export class SeatRepository {
  constructor(
    @InjectRepository(CinemaFunction)
    private readonly functionRepository: Repository<CinemaFunction>,
    @InjectRepository(Seats)
    private readonly seatRepository: Repository<Seats>,
    @InjectRepository(SeatLock)
    private readonly seatLockRepository: Repository<SeatLock>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  findFunctionForSelection(functionId: string): Promise<CinemaFunction | null> {
    return this.functionRepository.findOne({
      where: {
        id: functionId,
        active: true,
        startsAt: MoreThan(new Date()),
      },
      relations: ['room'],
    });
  }

  findSeatsByRoom(roomId: string): Promise<Seats[]> {
    return this.seatRepository.find({
      where: { roomId },
      order: { row: 'ASC', id: 'ASC' },
    });
  }

  findSeatsByIds(seatIds: string[]): Promise<Seats[]> {
    if (seatIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.seatRepository.find({
      where: { id: In(seatIds) },
    });
  }

  async findSoldSeatIds(functionId: string): Promise<string[]> {
    const tickets = await this.ticketRepository.find({
      where: {
        functionId,
        status: In(OCCUPYING_TICKET_STATUSES),
      },
    });
    return tickets.map((ticket) => ticket.seatId);
  }

  findActiveLocks(functionId: string, seatIds?: string[]): Promise<SeatLock[]> {
    return this.seatLockRepository.find({
      where: {
        functionId,
        expiresAt: MoreThan(new Date()),
        ...(seatIds && seatIds.length > 0 ? { seatId: In(seatIds) } : {}),
      },
    });
  }

  findCartLocks(functionId: string, cartId: string, seatIds?: string[]): Promise<SeatLock[]> {
    return this.seatLockRepository.find({
      where: {
        functionId,
        cartId,
        expiresAt: MoreThan(new Date()),
        ...(seatIds && seatIds.length > 0 ? { seatId: In(seatIds) } : {}),
      },
    });
  }

  async deleteExpiredLocks(functionId: string, seatIds: string[]): Promise<number> {
    if (seatIds.length === 0) {
      return 0;
    }
    const result = await this.seatLockRepository.delete({
      functionId,
      seatId: In(seatIds),
      expiresAt: LessThanOrEqual(new Date()),
    });
    return result.affected ?? 0;
  }

  async refreshLocks(functionId: string, cartId: string, seatIds: string[], expiresAt: Date): Promise<void> {
    if (seatIds.length === 0) {
      return;
    }
    await this.seatLockRepository.update(
      {
        functionId,
        cartId,
        seatId: In(seatIds),
      },
      { expiresAt },
    );
  }

  async createLocksIgnoreDuplicates(
    rows: { cartId: string; functionId: string; seatId: string; expiresAt: Date }[],
  ): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    await this.seatLockRepository.createQueryBuilder().insert().into(SeatLock).values(rows).orIgnore().execute();
  }

  async deleteCartLocks(functionId: string, cartId: string, seatIds?: string[]): Promise<number> {
    const result = await this.seatLockRepository.delete({
      functionId,
      cartId,
      ...(seatIds && seatIds.length > 0 ? { seatId: In(seatIds) } : {}),
    });
    return result.affected ?? 0;
  }
}
