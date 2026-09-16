import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { SeatLock } from '../../domain/entities/seat-lock.entity.js';
import { Seats } from '../../domain/entities/seat.entity.js';
import { SeatRepository } from '../../infrastructure/dao/seat.dao.js';
import {
  LockSeatsDto,
  LockSeatsResult,
  ReleaseSeatsDto,
  ReleaseSeatsResult,
  ReservationSummary,
  ReservationSummaryLine,
  SeatCategory,
  seatCategorySchema,
  SeatMap,
  SeatMapItem,
  SeatStatus,
} from '../dtos/seat-map.dto.js';

/** RN-039: duration of a seat's temporary lock. */
const LOCK_DURATION_MINUTES = 10;

/**
 * Maximum number of seats a user can select per function.
 * HU-010 describes it as "configurable by administration"; until that
 * configuration exists, it is exposed as a constant.
 */
const MAX_SEATS_PER_RESERVATION = 10;

/**
 * `seatType` is now constrained to `SeatCategory` at the entity/DB level
 * (see seat.entity.ts), so this only guards against legacy/unexpected values.
 */
const toCategory = (seatType: string | null | undefined): SeatCategory => {
  const parsed = seatCategorySchema.safeParse(seatType);
  return parsed.success ? parsed.data : 'STANDARD';
};

/**
 * Seats service (HU-010) — Interactive Seat Selection
 * -----------------------------------------------------
 * Holds the room seat-map logic and the lifecycle of the temporary locks
 * that reserve a seat while the user completes the purchase.
 */
@Injectable()
export class SeatService {
  constructor(private readonly seatRepository: SeatRepository) {}

  async getSeatMap(functionId: string, cartId?: string): Promise<SeatMap> {
    const cineFunction = await this.seatRepository.findFunctionForSelection(functionId);

    if (!cineFunction) {
      throw new NotFoundException('Función no encontrada.');
    }
    if (!cineFunction.room) {
      throw new UnprocessableEntityException('La función no tiene una sala asociada.');
    }

    const seats = await this.seatRepository.findSeatsByRoom(cineFunction.room.id);
    const soldSeatIds = new Set(await this.seatRepository.findSoldSeatIds(functionId));
    const activeLocks = await this.seatRepository.findActiveLocks(functionId);
    const lockBySeatId = new Map<string, SeatLock>(activeLocks.map((lock) => [lock.seatId, lock]));

    const items: SeatMapItem[] = seats.map((seat) => {
      const category = toCategory(seat.seatType);
      let status: SeatStatus;
      let lockedUntil: Date | null = null;

      if (category === 'DISABLED') {
        status = 'DISABLED';
      } else if (soldSeatIds.has(seat.id)) {
        status = 'SOLD';
      } else {
        const lock = lockBySeatId.get(seat.id);
        if (lock) {
          lockedUntil = lock.expiresAt;
          status = cartId !== undefined && lock.cartId === cartId ? 'SELECTED' : 'LOCKED';
        } else {
          status = 'AVAILABLE';
        }
      }

      return {
        id: seat.id,
        row: seat.row,
        number: seat.number,
        category,
        status,
        lockedUntil,
      };
    });

    return {
      functionId,
      room: {
        id: cineFunction.room.id,
        name: cineFunction.room.name,
        capacity: cineFunction.room.capacity,
      },
      maxSeatsPerReservation: MAX_SEATS_PER_RESERVATION,
      availableCount: items.filter((item) => item.status === 'AVAILABLE').length,
      seats: items,
    };
  }

  async lockSeats(data: LockSeatsDto): Promise<LockSeatsResult> {
    const { functionId, cartId } = data;
    const seatIds = [...new Set(data.seatIds)];

    if (seatIds.length === 0) {
      throw new BadRequestException('Debe seleccionar al menos una silla.');
    }
    if (seatIds.length > MAX_SEATS_PER_RESERVATION) {
      throw new BadRequestException(`Solo puede seleccionar hasta ${MAX_SEATS_PER_RESERVATION} sillas por función.`);
    }

    const cineFunction = await this.seatRepository.findFunctionForSelection(functionId);
    if (!cineFunction) {
      throw new NotFoundException('Función no encontrada.');
    }
    if (!cineFunction.room) {
      throw new UnprocessableEntityException('La función no tiene una sala asociada.');
    }

    // Seats must exist and belong to the function's room.
    const roomSeats = await this.seatRepository.findSeatsByRoom(cineFunction.room.id);
    const roomSeatById = new Map<string, Seats>(roomSeats.map((seat) => [seat.id, seat]));

    const notInRoom = seatIds.filter((id) => !roomSeatById.has(id));
    if (notInRoom.length > 0) {
      throw new BadRequestException(`Las sillas [${notInRoom.join(', ')}] no pertenecen a la sala de la función.`);
    }

    // RN-041 / RN-042: disabled seats cannot be selected.
    const disabled = seatIds.filter((id) => toCategory(roomSeatById.get(id)?.seatType) === 'DISABLED');
    if (disabled.length > 0) {
      throw new BadRequestException(`Las sillas [${disabled.join(', ')}] no están habilitadas para la venta.`);
    }

    // RN-040: release expired locks on these seats first.
    await this.seatRepository.deleteExpiredLocks(functionId, seatIds);

    // RN-041: discard seats that are sold or locked by another cart.
    const soldSeatIds = new Set(await this.seatRepository.findSoldSeatIds(functionId));
    const activeLocks = await this.seatRepository.findActiveLocks(functionId, seatIds);
    const lockBySeatId = new Map<string, SeatLock>(activeLocks.map((lock) => [lock.seatId, lock]));

    const rejectedSeatIds: string[] = [];
    const seatsOwnedByCart: string[] = [];
    const seatsToCreate: string[] = [];

    for (const seatId of seatIds) {
      if (soldSeatIds.has(seatId)) {
        rejectedSeatIds.push(seatId);
        continue;
      }
      const lock = lockBySeatId.get(seatId);
      if (lock && lock.cartId !== cartId) {
        rejectedSeatIds.push(seatId);
        continue;
      }
      if (lock) {
        seatsOwnedByCart.push(seatId);
      } else {
        seatsToCreate.push(seatId);
      }
    }

    const expiresAt = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);

    // Refresh the timer on seats this cart already held.
    await this.seatRepository.refreshLocks(functionId, cartId, seatsOwnedByCart, expiresAt);

    // Create the new locks. The unique index `(function_id, seat_id)` +
    // ON CONFLICT DO NOTHING prevents double-selling on simultaneous purchases (RN-043).
    await this.seatRepository.createLocksIgnoreDuplicates(
      seatsToCreate.map((seatId) => ({
        cartId,
        functionId,
        seatId,
        expiresAt,
      })),
    );

    // Confirm which seats effectively ended up under this cart.
    const confirmedLocks = await this.seatRepository.findCartLocks(functionId, cartId, seatIds);
    const lockedSeatIds = confirmedLocks.map((lock) => lock.seatId);

    // New seats that don't show up as owned lost the race.
    for (const seatId of seatsToCreate) {
      if (!lockedSeatIds.includes(seatId) && !rejectedSeatIds.includes(seatId)) {
        rejectedSeatIds.push(seatId);
      }
    }

    return {
      functionId,
      cartId,
      lockedSeatIds: [...lockedSeatIds].sort(),
      rejectedSeatIds: [...rejectedSeatIds].sort(),
      expiresAt,
    };
  }

  async releaseSeats(data: ReleaseSeatsDto): Promise<ReleaseSeatsResult> {
    const { functionId, cartId } = data;
    const seatIds = data.seatIds && data.seatIds.length > 0 ? [...new Set(data.seatIds)] : undefined;

    const releasedCount = await this.seatRepository.deleteCartLocks(functionId, cartId, seatIds);

    return { functionId, cartId, releasedCount };
  }

  async getReservationSummary(functionId: string, cartId: string): Promise<ReservationSummary> {
    const cineFunction = await this.seatRepository.findFunctionForSelection(functionId);
    if (!cineFunction) {
      throw new NotFoundException('Función no encontrada.');
    }

    const basePrice = Number(cineFunction.basePrice);
    const roomExtraPrice = Number(cineFunction.room?.extraPrice ?? 0);
    const unitPrice = basePrice + roomExtraPrice;

    const locks = await this.seatRepository.findCartLocks(functionId, cartId);

    if (locks.length === 0) {
      return {
        functionId,
        cartId,
        seatCount: 0,
        basePrice,
        roomExtraPrice,
        unitPrice,
        total: 0,
        expiresAt: null,
        lines: [],
      };
    }

    const seatIds = locks.map((lock) => lock.seatId);
    const seats = await this.seatRepository.findSeatsByIds(seatIds);
    const seatById = new Map<string, Seats>(seats.map((seat) => [seat.id, seat]));

    const lines: ReservationSummaryLine[] = locks
      .map((lock) => {
        const seat = seatById.get(lock.seatId);
        return {
          seatId: lock.seatId,
          row: seat?.row ?? '',
          number: seat?.number ?? '',
          category: seat ? toCategory(seat.seatType) : ('STANDARD' as SeatCategory),
          unitPrice,
        };
      })
      .sort((a, b) => a.seatId.localeCompare(b.seatId));

    const expiresAt = locks.reduce(
      (earliest, lock) => (lock.expiresAt < earliest ? lock.expiresAt : earliest),
      locks[0].expiresAt,
    );

    return {
      functionId,
      cartId,
      seatCount: locks.length,
      basePrice,
      roomExtraPrice,
      unitPrice,
      total: unitPrice * locks.length,
      expiresAt,
      lines,
    };
  }
}
