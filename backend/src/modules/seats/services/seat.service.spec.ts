import { BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { SeatService } from './seat.service.js';
import { SeatDao } from '../dao/seat.dao.js';
import { Seats } from '../entities/seat.entity.js';
import { SeatLock } from '../entities/seat-lock.entity.js';

describe('SeatService', () => {
  const mockFunction = {
    id: 'func-1',
    basePrice: 15000,
    room: {
      id: 'room-1',
      name: 'Sala 1',
      capacity: 50,
      extraPrice: 2000,
    },
  };

  const mockSeats: Seats[] = [
    { id: 'seat-1', row: 'A', number: 1, seatType: 'STANDARD' } as Seats,
    { id: 'seat-2', row: 'A', number: 2, seatType: 'PREFERENTIAL' } as Seats,
    { id: 'seat-3', row: 'A', number: 3, seatType: 'DISABLED' } as Seats,
  ];

  let seatDao: Record<keyof SeatDao, ReturnType<typeof vi.fn>>;
  let service: SeatService;

  beforeEach(() => {
    seatDao = {
      findFunctionForSelection: vi.fn().mockResolvedValue(mockFunction),
      findSeatsByRoom: vi.fn().mockResolvedValue(mockSeats),
      findSoldSeatIds: vi.fn().mockResolvedValue([]),
      findActiveLocks: vi.fn().mockResolvedValue([]),
      deleteExpiredLocks: vi.fn().mockResolvedValue(0),
      refreshLocks: vi.fn().mockResolvedValue(0),
      createLocksIgnoreDuplicates: vi.fn().mockResolvedValue([]),
      findCartLocks: vi.fn().mockResolvedValue([]),
      deleteCartLocks: vi.fn().mockResolvedValue(1),
      findSeatsByIds: vi.fn().mockResolvedValue([mockSeats[0]]),
    } as unknown as Record<keyof SeatDao, ReturnType<typeof vi.fn>>;

    service = new SeatService(seatDao as unknown as SeatDao);
  });

  describe('getSeatMap', () => {
    it('returns the seat map with correct availability and statuses', async () => {
      const activeLock: SeatLock = {
        seatId: 'seat-2',
        cartId: 'cart-123',
        expiresAt: new Date(),
      } as SeatLock;

      seatDao.findActiveLocks.mockResolvedValueOnce([activeLock]);
      seatDao.findSoldSeatIds.mockResolvedValueOnce(['seat-1']);

      const result = await service.getSeatMap('func-1', 'cart-123');

      expect(result.functionId).toBe('func-1');
      expect(result.room.name).toBe('Sala 1');
      expect(result.seats).toHaveLength(3);

      const seat1 = result.seats.find((s) => s.id === 'seat-1');
      const seat2 = result.seats.find((s) => s.id === 'seat-2');
      const seat3 = result.seats.find((s) => s.id === 'seat-3');

      expect(seat1?.status).toBe('SOLD');
      expect(seat2?.status).toBe('SELECTED');
      expect(seat3?.status).toBe('DISABLED');
    });

    it('marks a locked seat as LOCKED if cartId does not match', async () => {
      const otherCartLock: SeatLock = {
        seatId: 'seat-1',
        cartId: 'other-cart',
        expiresAt: new Date(),
      } as SeatLock;

      seatDao.findActiveLocks.mockResolvedValueOnce([otherCartLock]);

      const result = await service.getSeatMap('func-1', 'my-cart');
      const seat1 = result.seats.find((s) => s.id === 'seat-1');
      expect(seat1?.status).toBe('LOCKED');
    });

    it('throws NotFoundException when function does not exist', async () => {
      seatDao.findFunctionForSelection.mockResolvedValueOnce(null);

      await expect(service.getSeatMap('missing-func')).rejects.toThrow(NotFoundException);
    });

    it('throws UnprocessableEntityException when function has no room', async () => {
      seatDao.findFunctionForSelection.mockResolvedValueOnce({ id: 'f-1', room: null });

      await expect(service.getSeatMap('f-1')).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('lockSeats', () => {
    it('successfully locks available seats', async () => {
      seatDao.findCartLocks.mockResolvedValueOnce([
        { seatId: 'seat-1', cartId: 'cart-1' } as SeatLock,
      ]);

      const result = await service.lockSeats({
        functionId: 'func-1',
        cartId: 'cart-1',
        seatIds: ['seat-1'],
      });

      expect(result.lockedSeatIds).toContain('seat-1');
      expect(result.rejectedSeatIds).toHaveLength(0);
      expect(seatDao.createLocksIgnoreDuplicates).toHaveBeenCalled();
    });

    it('throws BadRequestException when no seats are provided', async () => {
      await expect(
        service.lockSeats({ functionId: 'func-1', cartId: 'cart-1', seatIds: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when exceeding maximum seats per reservation', async () => {
      const tooManySeats = Array.from({ length: 11 }, (_, i) => `seat-${i}`);

      await expect(
        service.lockSeats({ functionId: 'func-1', cartId: 'cart-1', seatIds: tooManySeats }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when function is missing during lock', async () => {
      seatDao.findFunctionForSelection.mockResolvedValueOnce(null);

      await expect(
        service.lockSeats({ functionId: 'func-1', cartId: 'cart-1', seatIds: ['seat-1'] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnprocessableEntityException when function room is missing during lock', async () => {
      seatDao.findFunctionForSelection.mockResolvedValueOnce({ id: 'func-1', room: null });

      await expect(
        service.lockSeats({ functionId: 'func-1', cartId: 'cart-1', seatIds: ['seat-1'] }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws BadRequestException if seat does not belong to the room', async () => {
      await expect(
        service.lockSeats({ functionId: 'func-1', cartId: 'cart-1', seatIds: ['invalid-seat'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if selecting a disabled seat', async () => {
      await expect(
        service.lockSeats({ functionId: 'func-1', cartId: 'cart-1', seatIds: ['seat-3'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects seats that are already sold or locked by another cart', async () => {
      seatDao.findSoldSeatIds.mockResolvedValueOnce(['seat-1']);
      seatDao.findActiveLocks.mockResolvedValueOnce([
        { seatId: 'seat-2', cartId: 'other-cart' } as SeatLock,
      ]);
      seatDao.findCartLocks.mockResolvedValueOnce([]);

      const result = await service.lockSeats({
        functionId: 'func-1',
        cartId: 'my-cart',
        seatIds: ['seat-1', 'seat-2'],
      });

      expect(result.rejectedSeatIds).toEqual(['seat-1', 'seat-2']);
      expect(result.lockedSeatIds).toHaveLength(0);
    });
  });

  describe('releaseSeats', () => {
    it('releases locked seats and returns released count', async () => {
      const result = await service.releaseSeats({
        functionId: 'func-1',
        cartId: 'cart-1',
        seatIds: ['seat-1'],
      });

      expect(result.releasedCount).toBe(1);
      expect(seatDao.deleteCartLocks).toHaveBeenCalledWith('func-1', 'cart-1', ['seat-1']);
    });
  });

  describe('getReservationSummary', () => {
    it('returns reservation summary with pricing breakdown when locks exist', async () => {
      const now = new Date();
      seatDao.findCartLocks.mockResolvedValueOnce([
        { seatId: 'seat-1', cartId: 'cart-1', expiresAt: now } as SeatLock,
      ]);

      const summary = await service.getReservationSummary('func-1', 'cart-1');

      expect(summary.functionId).toBe('func-1');
      expect(summary.seatCount).toBe(1);
      expect(summary.total).toBeGreaterThan(0);
      expect(summary.lines).toHaveLength(1);
    });

    it('returns empty summary when cart has no active locks', async () => {
      seatDao.findCartLocks.mockResolvedValueOnce([]);

      const summary = await service.getReservationSummary('func-1', 'cart-1');

      expect(summary.seatCount).toBe(0);
      expect(summary.total).toBe(0);
      expect(summary.lines).toEqual([]);
    });

    it('throws NotFoundException when function is not found for summary', async () => {
      seatDao.findFunctionForSelection.mockResolvedValueOnce(null);

      await expect(service.getReservationSummary('missing-func', 'cart-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
