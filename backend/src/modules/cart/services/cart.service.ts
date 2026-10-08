import { randomUUID } from 'node:crypto';
import { BadRequestException, GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { calculateSeatUnitPrice } from '../../../shared/domain/money/tariff.util.js';
import { CinemaFunction } from '../../functions/entities/function.entity.js';
import { Movie } from '../../movies/entities/movie.entity.js';
import { GiftCardDao } from '../../promotions/dao/gift-card.dao.js';
import { PromotionDao } from '../../promotions/dao/promotion.dao.js';
import { Promotion } from '../../promotions/entities/promotion.entity.js';
import { SeatLock } from '../../seats/entities/seat-lock.entity.js';
import { MembershipDao } from '../../users/dao/membership.dao.js';
import { Cart } from '../entities/cart.entity.js';
import { CartConcessionItem } from '../entities/cart-concession-item.entity.js';
import { CartItemDao } from '../dao/cart-item.dao.js';
import { CartDao } from '../dao/cart.dao.js';
import {
  ApplyGiftCardDto,
  CartIdDto,
  CartResponse,
  CartSummary,
  CartTicketLine,
  CreateCartDto,
  DeleteCartResult,
  UpdateCartDto,
} from '../dtos/cart.dto.js';

/** RN-046: a cart expires ten minutes after its last activity. */
const CART_TTL_MINUTES = 10;

/**
 * Placeholder tax rate ("Impuestos" in the cart summary). Like
 * `MAX_SEATS_PER_RESERVATION` in HU-010's SeatService, this is exposed as a
 * constant until an administrative configuration for it exists.
 */
const TAX_RATE = 0.19;

/**
 * Cart service (HU-011) — Administración del Carrito de Compras
 * -----------------------------------------------------------------
 * Orchestrates the temporary cart created after seat selection: aggregates
 * the "Entradas" (from HU-010's seat locks) and "Confitería" line items,
 * applies membership/promotion/gift-card discounts, and computes the totals
 * shown before checkout.
 */
@Injectable()
export class CartService {
  constructor(
    private readonly cartDao: CartDao,
    private readonly cartItemDao: CartItemDao,
    private readonly membershipDao: MembershipDao,
    private readonly promotionDao: PromotionDao,
    private readonly giftCardDao: GiftCardDao,
  ) {}

  /**
   * Crea un nuevo carrito de compras para el usuario o retorna el actualmente activo.
   *
   * Cumple con la regla de negocio RN-044 (unicidad del carrito activo por usuario).
   *
   * @param dto Parámetros para la creación/obtención del carrito, incluyendo userId y opcionalmente cartId.
   * @returns El carrito consolidado con sus líneas de entradas y confitería.
   */
  async createOrGetCart(dto: CreateCartDto): Promise<CartResponse> {
    const existing = await this.resolveExpiry(await this.cartDao.findActiveByUserId(dto.userId));
    if (existing) {
      return this.buildResponse(existing);
    }

    const cart = await this.cartDao.create({
      id: dto.cartId ?? randomUUID(),
      userId: dto.userId,
      status: 'ACTIVE',
      membershipApplied: false,
      expiresAt: this.nextExpiry(),
    });
    return this.buildResponse(cart);
  }

  /**
   * Obtiene un carrito de compras a partir de su identificador UUID.
   *
   * Resuelve perezosamente la expiración si la ventana de inactividad de 10 minutos (RN-046) fue superada.
   *
   * @param cartId Identificador UUID del carrito.
   * @returns Datos consolidados del carrito y desglose financiero.
   * @throws NotFoundException Si el carrito no existe en la base de datos.
   */
  async getCart(cartId: string): Promise<CartResponse> {
    const cart = await this.getCartOrFail(cartId);
    return this.buildResponse(cart);
  }

  /**
   * Agrega, modifica o elimina (cantidad 0) productos de confitería en el carrito.
   *
   * Valida stock disponible, estado del producto y renueva la ventana de expiración del carrito.
   *
   * @param dto Objeto con el identificador del carrito y lista de ítems de confitería.
   * @returns El carrito actualizado con subtotales recalculados.
   * @throws NotFoundException Si el producto o carrito no existen.
   * @throws BadRequestException Si el producto está inactivo o la cantidad solicitada excede el inventario.
   * @throws GoneException Si el carrito expiró o ya no está en estado ACTIVE.
   */
  async updateCart(dto: UpdateCartDto): Promise<CartResponse> {
    const cart = await this.getActiveCartOrFail(dto.cartId);

    const productIds = [...new Set(dto.concessionItems.map((item) => item.productId))];
    const products = await this.cartItemDao.findProductsByIds(productIds);
    const productById = new Map(products.map((product) => [product.id, product]));

    for (const item of dto.concessionItems) {
      const product = productById.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Producto ${item.productId} no encontrado.`);
      }
      if (item.quantity === 0) {
        await this.cartItemDao.removeConcessionItem(cart.id, item.productId);
        continue;
      }
      if (!product.active) {
        throw new BadRequestException(`El producto "${product.name}" no está disponible.`);
      }
      // Validación: no permitir agregar productos agotados.
      if (product.stock < item.quantity) {
        throw new BadRequestException(`No hay suficiente stock de "${product.name}" (disponible: ${product.stock}).`);
      }
      await this.cartItemDao.upsertConcessionItem(cart.id, item.productId, item.quantity, Number(product.price));
    }

    await this.touch(cart);
    return this.buildResponse(cart);
  }

  /**
   * Cancela el carrito de compras y libera las sillas bloqueadas asociadas (RN-045).
   *
   * Limpia los ítems de confitería y bonos asociados, y marca el carrito como CANCELLED.
   *
   * @param dto Objeto con el identificador del carrito a cancelar.
   * @returns Resultado con el estado final y el total de sillas liberadas.
   * @throws NotFoundException Si el carrito no existe.
   */
  async deleteCart(dto: CartIdDto): Promise<DeleteCartResult> {
    const cart = await this.getCartOrFail(dto.cartId);

    const releasedSeats = await this.cartDao.deleteLocksByCartId(cart.id);
    await this.cartItemDao.clearConcessionItems(cart.id);
    await this.cartItemDao.clearGiftCards(cart.id);
    await this.cartDao.updateStatus(cart.id, 'CANCELLED');

    return { cartId: cart.id, status: 'CANCELLED', releasedSeats };
  }

  /**
   * Aplica el beneficio de membresía activa del usuario a las entradas del carrito (RN-047).
   *
   * @param dto Objeto con el identificador del carrito.
   * @returns El carrito con el descuento de membresía reflejado en los totales.
   * @throws NotFoundException Si el usuario no tiene una membresía activa vigente.
   * @throws GoneException Si el carrito ya no está activo.
   */
  async applyMembership(dto: CartIdDto): Promise<CartResponse> {
    const cart = await this.getActiveCartOrFail(dto.cartId);

    const membership = await this.membershipDao.findActiveByUserId(cart.userId);
    if (!membership) {
      throw new NotFoundException('No se encontró una membresía activa para este usuario.');
    }

    cart.membershipApplied = true;
    await this.cartDao.save(cart);
    await this.touch(cart);
    return this.buildResponse(cart);
  }

  /**
   * Aplica un bono de regalo (giftcard) al carrito de compras.
   *
   * Valida la existencia del bono, su estado activo y saldo disponible.
   *
   * @param dto Objeto con el identificador del carrito y el código del bono.
   * @returns El carrito actualizado con el bono vinculado.
   * @throws NotFoundException Si el bono no existe o está inactivo.
   * @throws BadRequestException Si el saldo del bono es 0 o negativo.
   * @throws GoneException Si el carrito ya no está activo.
   */
  async applyGiftCard(dto: ApplyGiftCardDto): Promise<CartResponse> {
    const cart = await this.getActiveCartOrFail(dto.cartId);

    const giftCard = await this.giftCardDao.findByCode(dto.code);
    if (!giftCard || !giftCard.active) {
      throw new NotFoundException('Bono no encontrado o inactivo.');
    }
    if (Number(giftCard.balance) <= 0) {
      throw new BadRequestException('El bono no tiene saldo disponible.');
    }

    await this.cartItemDao.addGiftCard(cart.id, giftCard.id);
    await this.touch(cart);
    return this.buildResponse(cart);
  }

  // ---------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------

  private async getCartOrFail(cartId: string): Promise<Cart> {
    const cart = await this.resolveExpiry(await this.cartDao.findById(cartId));
    if (!cart) {
      throw new NotFoundException('Carrito no encontrado.');
    }
    return cart;
  }

  private async getActiveCartOrFail(cartId: string): Promise<Cart> {
    const cart = await this.getCartOrFail(cartId);
    if (cart.status !== 'ACTIVE') {
      throw new GoneException(`El carrito ya no está activo (estado: ${cart.status}).`);
    }
    return cart;
  }

  private nextExpiry(): Date {
    return new Date(Date.now() + CART_TTL_MINUTES * 60 * 1000);
  }

  /** RN-046: refreshes the ten-minute inactivity window after a mutation. */
  private async touch(cart: Cart): Promise<void> {
    cart.expiresAt = this.nextExpiry();
    await this.cartDao.save(cart);
  }

  /** RN-046: lazily expires a cart (and releases its seat locks) once its window has elapsed. */
  private async resolveExpiry(cart: Cart | null): Promise<Cart | null> {
    if (!cart) {
      return null;
    }
    if (cart.status === 'ACTIVE' && cart.expiresAt.getTime() <= Date.now()) {
      await this.cartDao.deleteLocksByCartId(cart.id);
      await this.cartDao.updateStatus(cart.id, 'EXPIRED');
      cart.status = 'EXPIRED';
    }
    return cart;
  }

  private async buildResponse(cart: Cart): Promise<CartResponse> {
    const [locks, concessionItems, cartGiftCards, membership] = await Promise.all([
      this.cartDao.findLocksByCartId(cart.id),
      this.cartItemDao.findConcessionItemsByCartId(cart.id),
      this.cartItemDao.findGiftCardsByCartId(cart.id),
      cart.membershipApplied ? this.membershipDao.findActiveByUserId(cart.userId) : Promise.resolve(null),
    ]);

    const functionIds = [...new Set(locks.map((lock) => lock.functionId))];
    const functions = await this.cartDao.findFunctionsByIds(functionIds);
    const movieIds = [...new Set(functions.map((f) => f.movieId))];
    const movies = await this.cartDao.findMoviesByIds(movieIds);

    const membershipDiscountPercent = membership ? Number(membership.discountPercent) : 0;
    const tickets = buildTicketLines(locks, functions, movies, membershipDiscountPercent);

    const productIds = concessionItems.map((item) => item.productId);
    const promotions = await this.promotionDao.findActiveApplicable(productIds);
    const { lines: concessionLines, totalDiscount: promotionsDiscount } = buildConcessionLines(
      concessionItems,
      promotions,
    );

    const ticketsSubtotal = tickets.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const membershipDiscount = tickets.reduce((sum, line) => sum + line.discount, 0);
    const concessionsSubtotal = concessionLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

    const subtotal = ticketsSubtotal + concessionsSubtotal;
    const taxableBase = Math.max(subtotal - membershipDiscount - promotionsDiscount, 0);
    const taxes = taxableBase * TAX_RATE;
    const totalBeforeGiftCards = taxableBase + taxes;

    const { appliedGiftCards, giftCardsApplied } = applyGiftCards(cartGiftCards, totalBeforeGiftCards);
    const total = Math.max(totalBeforeGiftCards - giftCardsApplied, 0);

    const summary: CartSummary = {
      subtotal,
      membershipDiscount,
      promotionsDiscount,
      giftCardsApplied,
      taxRate: TAX_RATE,
      taxes,
      total,
    };

    return {
      id: cart.id,
      userId: cart.userId,
      status: cart.status,
      membershipApplied: cart.membershipApplied,
      expiresAt: cart.expiresAt,
      createdAt: cart.createdAt,
      tickets,
      concessionItems: concessionLines,
      appliedGiftCards,
      summary,
    };
  }
}

// ---------------------------------------------------------------------
// Pure calculation helpers
// ---------------------------------------------------------------------

function buildTicketLines(
  locks: SeatLock[],
  functions: CinemaFunction[],
  movies: Movie[],
  membershipDiscountPercent: number,
): CartTicketLine[] {
  const functionById = new Map(functions.map((f) => [f.id, f]));
  const movieById = new Map(movies.map((m) => [m.id, m]));

  const locksByFunction = new Map<string, SeatLock[]>();
  for (const lock of locks) {
    const list = locksByFunction.get(lock.functionId) ?? [];
    list.push(lock);
    locksByFunction.set(lock.functionId, list);
  }

  const lines: CartTicketLine[] = [];
  for (const [functionId, functionLocks] of locksByFunction) {
    const cineFunction = functionById.get(functionId);
    if (!cineFunction) {
      continue;
    }
    const movie = movieById.get(cineFunction.movieId);
    const basePrice = Number(cineFunction.basePrice);
    const roomExtraPrice = Number(cineFunction.room?.extraPrice ?? 0);
    const unitPrice = calculateSeatUnitPrice(basePrice, roomExtraPrice);
    const quantity = functionLocks.length;
    const lineSubtotal = unitPrice * quantity;
    const discount = membershipDiscountPercent > 0 ? lineSubtotal * (membershipDiscountPercent / 100) : 0;
    const expiresAt = functionLocks.reduce<Date>(
      (earliest, lock) => (lock.expiresAt < earliest ? lock.expiresAt : earliest),
      functionLocks[0].expiresAt,
    );

    lines.push({
      functionId,
      movieTitle: movie?.title ?? 'Película no disponible',
      startsAt: cineFunction.startsAt,
      roomName: cineFunction.room?.name ?? '',
      format: cineFunction.functionType?.projection ?? '',
      quantity,
      seatLabels: functionLocks
        .map((lock) => `${lock.seat?.row ?? ''}${lock.seat?.number ?? ''}`)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      unitPrice,
      discount,
      total: Math.max(lineSubtotal - discount, 0),
      expiresAt,
    });
  }

  return lines.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/**
 * RN-048: when several active promotions apply to the same target and at
 * least one of them forbids combination, only the single best one is used;
 * otherwise every combinable promotion stacks.
 */
function pickDiscount(promotions: Promotion[], base: number): { amount: number; promotion: Promotion | null } {
  if (promotions.length === 0 || base <= 0) {
    return { amount: 0, promotion: null };
  }
  const candidates = promotions.map((promotion) => ({
    promotion,
    amount:
      promotion.discountType === 'PERCENTAGE'
        ? base * (Number(promotion.discountValue) / 100)
        : Number(promotion.discountValue),
  }));
  const best = candidates.reduce((a, b) => (b.amount > a.amount ? b : a), candidates[0]);

  const hasNonCombinable = promotions.some((promotion) => !promotion.combinable);
  if (hasNonCombinable) {
    return { amount: Math.min(best.amount, base), promotion: best.promotion };
  }
  const total = candidates.reduce((sum, candidate) => sum + candidate.amount, 0);
  return { amount: Math.min(total, base), promotion: best.promotion };
}

function buildConcessionLines(
  items: CartConcessionItem[],
  promotions: Promotion[],
): { lines: CartResponse['concessionItems']; totalDiscount: number } {
  const cartWidePromotions = promotions.filter((p) => p.productId === null);
  const promotionsByProduct = new Map<string, Promotion[]>();
  for (const promotion of promotions) {
    if (promotion.productId === null) {
      continue;
    }
    const list = promotionsByProduct.get(promotion.productId) ?? [];
    list.push(promotion);
    promotionsByProduct.set(promotion.productId, list);
  }

  let productLevelDiscount = 0;
  const lines = items.map((item) => {
    const lineSubtotal = Number(item.unitPrice) * item.quantity;
    const { amount, promotion } = pickDiscount(promotionsByProduct.get(item.productId) ?? [], lineSubtotal);
    productLevelDiscount += amount;

    return {
      id: item.id,
      productId: item.productId,
      name: item.product?.name ?? '',
      imageUrl: item.product?.imageUrl ?? null,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      promotion: promotion ? { code: promotion.code, name: promotion.name, discountAmount: amount } : null,
      subtotal: Math.max(lineSubtotal - amount, 0),
    };
  });

  const concessionsSubtotalAfterProductPromos = lines.reduce((sum, line) => sum + line.subtotal, 0);
  const cartWide = pickDiscount(cartWidePromotions, concessionsSubtotalAfterProductPromos);

  return { lines, totalDiscount: productLevelDiscount + cartWide.amount };
}

/**
 * Redeems attached gift cards, in the order they were applied, against the
 * cart's total until either the total or every gift card's balance is exhausted.
 */
function applyGiftCards(
  cartGiftCards: { giftCard?: { code: string; balance: number } }[],
  totalBeforeGiftCards: number,
): { appliedGiftCards: CartResponse['appliedGiftCards']; giftCardsApplied: number } {
  let remaining = totalBeforeGiftCards;
  const appliedGiftCards = cartGiftCards
    .filter((cartGiftCard) => cartGiftCard.giftCard)
    .map((cartGiftCard) => {
      const giftCard = cartGiftCard.giftCard!;
      const balance = Number(giftCard.balance);
      const amountApplied = Math.min(balance, remaining);
      remaining = Math.max(remaining - amountApplied, 0);
      return { code: giftCard.code, amountApplied, remainingBalance: balance - amountApplied };
    });

  const giftCardsApplied = appliedGiftCards.reduce((sum, entry) => sum + entry.amountApplied, 0);
  return { appliedGiftCards, giftCardsApplied };
}
