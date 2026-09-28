import { BadRequestException, GoneException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service.js';
import { CartRepository } from '../../infrastructure/dao/cart.repository.js';
import { CartItemRepository } from '../../infrastructure/dao/cart-item.repository.js';
import { MembershipRepository } from '../../../users/infrastructure/dao/membership.repository.js';
import { PromotionRepository } from '../../../promotions/infrastructure/dao/promotion.repository.js';
import { GiftCardRepository } from '../../../promotions/infrastructure/dao/gift-card.repository.js';
import { Cart } from '../../domain/entities/cart.entity.js';
import { Product } from '../../domain/entities/product.entity.js';
import { CinemaFunction } from '../../../functions/domain/entities/function.entity.js';
import { Movie } from '../../../movies/domain/entities/movie.entity.js';
import { SeatLock } from '../../../seats/domain/entities/seat-lock.entity.js';
import { Promotion } from '../../../promotions/domain/entities/promotion.entity.js';
import { Membership } from '../../../users/domain/entities/membership.entity.js';

const FUTURE = new Date(Date.now() + 10 * 60 * 1000);
const PAST = new Date(Date.now() - 60 * 1000);

const activeCart = (overrides: Partial<Cart> = {}): Cart =>
  ({
    id: 'cart-1',
    userId: 'user-1',
    status: 'ACTIVE',
    membershipApplied: false,
    expiresAt: FUTURE,
    createdAt: new Date(),
    ...overrides,
  }) as Cart;

const cineFunction: CinemaFunction = {
  id: 'function-1',
  movieId: 'movie-1',
  roomId: 'room-1',
  room: { id: 'room-1', name: 'Sala 1', extraPrice: 5000 },
  functionTypeId: 'ftype-1',
  functionType: { projection: '3D' },
  startsAt: new Date('2026-10-01T20:00:00Z'),
  basePrice: 20000,
  active: true,
} as unknown as CinemaFunction;

const movie: Movie = { id: 'movie-1', title: 'Interstellar' } as Movie;

const seatLock = (seatId: string, row: string, number: string): SeatLock =>
  ({
    id: `lock-${seatId}`,
    cartId: 'cart-1',
    functionId: 'function-1',
    seatId,
    seat: { row, number },
    expiresAt: FUTURE,
    createdAt: new Date(),
  }) as unknown as SeatLock;

const product = (id: string, price: number, stock = 10, active = true): Product =>
  ({ id, name: `Product ${id}`, imageUrl: null, price, stock, active }) as Product;

describe('CartService', () => {
  const buildService = (
    overrides: {
      cart?: Cart | null;
      activeCartForUser?: Cart | null;
      locks?: SeatLock[];
      products?: Product[];
      concessionItems?: Record<string, unknown>[];
      giftCards?: Record<string, unknown>[];
      membership?: Membership | null;
      promotions?: Promotion[];
    } = {},
  ) => {
    const cartRepository = {
      findById: vi.fn().mockResolvedValue('cart' in overrides ? overrides.cart : activeCart()),
      findActiveByUserId: vi.fn().mockResolvedValue(overrides.activeCartForUser ?? null),
      create: vi.fn().mockImplementation((data) => Promise.resolve({ ...activeCart(), ...data })),
      save: vi.fn().mockImplementation((cart) => Promise.resolve(cart)),
      updateStatus: vi.fn().mockResolvedValue(undefined),
      findLocksByCartId: vi.fn().mockResolvedValue(overrides.locks ?? []),
      deleteLocksByCartId: vi.fn().mockResolvedValue(overrides.locks?.length ?? 0),
      findFunctionsByIds: vi.fn().mockResolvedValue([cineFunction]),
      findMoviesByIds: vi.fn().mockResolvedValue([movie]),
    } as unknown as CartRepository;

    const cartItemRepository = {
      findProductsByIds: vi.fn().mockResolvedValue(overrides.products ?? []),
      findConcessionItemsByCartId: vi.fn().mockResolvedValue(overrides.concessionItems ?? []),
      upsertConcessionItem: vi.fn().mockResolvedValue(undefined),
      removeConcessionItem: vi.fn().mockResolvedValue(undefined),
      clearConcessionItems: vi.fn().mockResolvedValue(undefined),
      findGiftCardsByCartId: vi.fn().mockResolvedValue(overrides.giftCards ?? []),
      addGiftCard: vi.fn().mockResolvedValue(undefined),
      clearGiftCards: vi.fn().mockResolvedValue(undefined),
    } as unknown as CartItemRepository;

    const membershipRepository = {
      findActiveByUserId: vi.fn().mockResolvedValue('membership' in overrides ? overrides.membership : null),
    } as unknown as MembershipRepository;

    const promotionRepository = {
      findActiveApplicable: vi.fn().mockResolvedValue(overrides.promotions ?? []),
    } as unknown as PromotionRepository;

    const giftCardRepository = {
      findByCode: vi.fn(),
    } as unknown as GiftCardRepository;

    return {
      service: new CartService(
        cartRepository,
        cartItemRepository,
        membershipRepository,
        promotionRepository,
        giftCardRepository,
      ),
      cartRepository,
      cartItemRepository,
      membershipRepository,
      promotionRepository,
      giftCardRepository,
    };
  };

  describe('createOrGetCart', () => {
    it('RN-044: returns the existing active cart instead of creating a new one', async () => {
      const existing = activeCart();
      const { service, cartRepository } = buildService({ activeCartForUser: existing });

      const result = await service.createOrGetCart({ userId: 'user-1' });

      expect(cartRepository.create).not.toHaveBeenCalled();
      expect(result.id).toBe('cart-1');
    });

    it('creates a new cart when the user has none active', async () => {
      const { service, cartRepository } = buildService({ activeCartForUser: null });

      const result = await service.createOrGetCart({ userId: 'user-2', cartId: 'cart-2' });

      expect(cartRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'cart-2', userId: 'user-2', status: 'ACTIVE' }),
      );
      expect(result.id).toBe('cart-2');
    });
  });

  describe('getCart', () => {
    it('throws NotFoundException when the cart does not exist', async () => {
      const { service } = buildService({ cart: null });

      await expect(service.getCart('missing')).rejects.toThrow(NotFoundException);
    });

    it('RN-046: lazily expires an active cart past its window and releases its seat locks', async () => {
      const expired = activeCart({ expiresAt: PAST });
      const { service, cartRepository } = buildService({ cart: expired, locks: [seatLock('seat-1', 'A', '1')] });

      const result = await service.getCart('cart-1');

      expect(cartRepository.updateStatus).toHaveBeenCalledWith('cart-1', 'EXPIRED');
      expect(cartRepository.deleteLocksByCartId).toHaveBeenCalledWith('cart-1');
      expect(result.status).toBe('EXPIRED');
    });

    it('computes ticket lines with the membership discount applied (RN-047)', async () => {
      const cart = activeCart({ membershipApplied: true });
      const membership = { id: 'm1', userId: 'user-1', tier: 'GOLD', discountPercent: 10, active: true } as Membership;
      const { service } = buildService({
        cart,
        locks: [seatLock('seat-1', 'A', '1'), seatLock('seat-2', 'A', '2')],
        membership,
      });

      const result = await service.getCart('cart-1');

      // unitPrice = basePrice(20000) + roomExtraPrice(5000) = 25000; quantity = 2 => subtotal 50000
      expect(result.tickets).toHaveLength(1);
      expect(result.tickets[0].quantity).toBe(2);
      expect(result.tickets[0].unitPrice).toBe(25000);
      expect(result.tickets[0].discount).toBeCloseTo(5000); // 10% of 50000
      expect(result.summary.membershipDiscount).toBeCloseTo(5000);
      expect(result.summary.subtotal).toBeCloseTo(50000);
      // taxableBase = 45000, taxes = 45000 * 0.19 = 8550, total = 53550
      expect(result.summary.total).toBeCloseTo(53550);
    });

    it('RN-048: applies only the best discount when a non-combinable promotion competes with others', async () => {
      const concessionItems = [
        { id: 'ci-1', cartId: 'cart-1', productId: 'p1', quantity: 1, unitPrice: 10000, product: { name: 'Popcorn' } },
      ];
      const promotions = [
        {
          id: 'promo-1',
          code: 'P1',
          name: 'Small',
          productId: 'p1',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          combinable: true,
          active: true,
        },
        {
          id: 'promo-2',
          code: 'P2',
          name: 'Big',
          productId: 'p1',
          discountType: 'PERCENTAGE',
          discountValue: 30,
          combinable: false,
          active: true,
        },
      ] as Promotion[];
      const { service } = buildService({ concessionItems, promotions });

      const result = await service.getCart('cart-1');

      expect(result.concessionItems[0].promotion?.code).toBe('P2');
      expect(result.summary.promotionsDiscount).toBeCloseTo(3000); // 30% of 10000, not 40%
    });

    it('RN-048: sums every promotion when all of them are combinable', async () => {
      const concessionItems = [
        { id: 'ci-1', cartId: 'cart-1', productId: 'p1', quantity: 1, unitPrice: 10000, product: { name: 'Popcorn' } },
      ];
      const promotions = [
        {
          id: 'promo-1',
          code: 'P1',
          name: 'A',
          productId: 'p1',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          combinable: true,
          active: true,
        },
        {
          id: 'promo-2',
          code: 'P2',
          name: 'B',
          productId: 'p1',
          discountType: 'PERCENTAGE',
          discountValue: 5,
          combinable: true,
          active: true,
        },
      ] as Promotion[];
      const { service } = buildService({ concessionItems, promotions });

      const result = await service.getCart('cart-1');

      expect(result.summary.promotionsDiscount).toBeCloseTo(1500); // 10% + 5% of 10000
    });
  });

  describe('updateCart', () => {
    it('rejects a cart that is no longer active', async () => {
      const { service } = buildService({ cart: activeCart({ status: 'CANCELLED' }) });

      await expect(
        service.updateCart({ cartId: 'cart-1', concessionItems: [{ productId: 'p1', quantity: 1 }] }),
      ).rejects.toThrow(GoneException);
    });

    it('validation: rejects adding out-of-stock products', async () => {
      const { service } = buildService({ products: [product('p1', 5000, 1)] });

      await expect(
        service.updateCart({ cartId: 'cart-1', concessionItems: [{ productId: 'p1', quantity: 5 }] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('validation: rejects inactive products', async () => {
      const { service } = buildService({ products: [product('p1', 5000, 10, false)] });

      await expect(
        service.updateCart({ cartId: 'cart-1', concessionItems: [{ productId: 'p1', quantity: 1 }] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('removes the line item when quantity is 0', async () => {
      const { service, cartItemRepository } = buildService({ products: [product('p1', 5000)] });

      await service.updateCart({ cartId: 'cart-1', concessionItems: [{ productId: 'p1', quantity: 0 }] });

      expect(cartItemRepository.removeConcessionItem).toHaveBeenCalledWith('cart-1', 'p1');
      expect(cartItemRepository.upsertConcessionItem).not.toHaveBeenCalled();
    });

    it('RN-046: refreshes the cart expiry after a successful mutation', async () => {
      const cart = activeCart({ expiresAt: new Date(Date.now() + 60 * 1000) });
      const { service, cartRepository } = buildService({ cart, products: [product('p1', 5000)] });

      await service.updateCart({ cartId: 'cart-1', concessionItems: [{ productId: 'p1', quantity: 2 }] });

      const saved = (cartRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as Cart;
      expect(saved.expiresAt.getTime()).toBeGreaterThan(Date.now() + 5 * 60 * 1000);
    });
  });

  describe('deleteCart', () => {
    it('releases seat locks and cancels the cart', async () => {
      const { service, cartRepository, cartItemRepository } = buildService({
        locks: [seatLock('seat-1', 'A', '1')],
      });

      const result = await service.deleteCart({ cartId: 'cart-1' });

      expect(cartRepository.deleteLocksByCartId).toHaveBeenCalledWith('cart-1');
      expect(cartItemRepository.clearConcessionItems).toHaveBeenCalledWith('cart-1');
      expect(cartItemRepository.clearGiftCards).toHaveBeenCalledWith('cart-1');
      expect(cartRepository.updateStatus).toHaveBeenCalledWith('cart-1', 'CANCELLED');
      expect(result).toEqual({ cartId: 'cart-1', status: 'CANCELLED', releasedSeats: 1 });
    });
  });

  describe('applyMembership', () => {
    it('RN-047: throws NotFoundException when the user has no active membership', async () => {
      const { service } = buildService({ membership: null });

      await expect(service.applyMembership({ cartId: 'cart-1' })).rejects.toThrow(NotFoundException);
    });

    it('marks the cart as membership-applied', async () => {
      const membership = { id: 'm1', userId: 'user-1', discountPercent: 10, active: true } as Membership;
      const { service, cartRepository } = buildService({ membership });

      const result = await service.applyMembership({ cartId: 'cart-1' });

      expect(result.membershipApplied).toBe(true);
      expect(cartRepository.save).toHaveBeenCalledWith(expect.objectContaining({ membershipApplied: true }));
    });
  });

  describe('applyGiftCard', () => {
    it('throws NotFoundException for an unknown or inactive code', async () => {
      const { service, giftCardRepository } = buildService();
      (giftCardRepository.findByCode as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.applyGiftCard({ cartId: 'cart-1', code: 'BADCODE' })).rejects.toThrow(NotFoundException);
    });

    it('rejects a gift card with no remaining balance', async () => {
      const { service, giftCardRepository } = buildService();
      (giftCardRepository.findByCode as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'gc-1',
        code: 'EMPTY',
        balance: 0,
        active: true,
      });

      await expect(service.applyGiftCard({ cartId: 'cart-1', code: 'EMPTY' })).rejects.toThrow(BadRequestException);
    });

    it('attaches a valid gift card to the cart', async () => {
      const { service, giftCardRepository, cartItemRepository } = buildService();
      (giftCardRepository.findByCode as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'gc-1',
        code: 'GIFT10',
        balance: 10000,
        active: true,
      });

      await service.applyGiftCard({ cartId: 'cart-1', code: 'GIFT10' });

      expect(cartItemRepository.addGiftCard).toHaveBeenCalledWith('cart-1', 'gc-1');
    });
  });
});
