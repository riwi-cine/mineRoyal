import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CinemaFunction } from '../../../functions/domain/entities/function.entity.js';
import { Movie } from '../../../movies/domain/entities/movie.entity.js';
import { SeatLock } from '../../../seats/domain/entities/seat-lock.entity.js';
import { Cart, CartStatus } from '../../domain/entities/cart.entity.js';

/**
 * Carts repository (HU-011)
 * --------------------------
 * Owns the `carts` table plus the read access this module needs into the
 * `seat_locks` (RN-045: seats stay locked while the cart is active) and
 * `functions`/`movies` tables to render the "Entradas" section of the cart.
 */
@Injectable()
export class CartRepository {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(SeatLock)
    private readonly seatLockRepository: Repository<SeatLock>,
    @InjectRepository(CinemaFunction)
    private readonly functionRepository: Repository<CinemaFunction>,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  findById(id: string): Promise<Cart | null> {
    return this.cartRepository.findOne({ where: { id } });
  }

  /** RN-044: a user may only have one ACTIVE cart at a time. */
  findActiveByUserId(userId: string): Promise<Cart | null> {
    return this.cartRepository.findOne({ where: { userId, status: 'ACTIVE' } });
  }

  create(cart: Pick<Cart, 'id' | 'userId' | 'status' | 'expiresAt' | 'membershipApplied'>): Promise<Cart> {
    return this.cartRepository.save(this.cartRepository.create(cart));
  }

  save(cart: Cart): Promise<Cart> {
    return this.cartRepository.save(cart);
  }

  async updateStatus(id: string, status: CartStatus): Promise<void> {
    await this.cartRepository.update({ id }, { status });
  }

  findLocksByCartId(cartId: string): Promise<SeatLock[]> {
    return this.seatLockRepository.find({ where: { cartId }, relations: ['seat'] });
  }

  async deleteLocksByCartId(cartId: string): Promise<number> {
    const result = await this.seatLockRepository.delete({ cartId });
    return result.affected ?? 0;
  }

  findFunctionsByIds(functionIds: string[]): Promise<CinemaFunction[]> {
    if (functionIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.functionRepository.find({
      where: { id: In(functionIds) },
      relations: ['room', 'functionType'],
    });
  }

  findMoviesByIds(movieIds: string[]): Promise<Movie[]> {
    if (movieIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.movieRepository.find({ where: { id: In(movieIds) } });
  }
}
