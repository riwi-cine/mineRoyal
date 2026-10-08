import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CinemaFunction } from '../../functions/entities/function.entity.js';
import { FunctionDao } from '../../functions/dao/function.dao.js';
import { Movie } from '../../movies/entities/movie.entity.js';
import { MovieDao } from '../../movies/dao/movie.dao.js';
import { SeatLock } from '../../seats/entities/seat-lock.entity.js';
import { SeatDao } from '../../seats/dao/seat.dao.js';
import { Cart, CartStatus } from '../entities/cart.entity.js';

/**
 * Carts repository (HU-011) — Diseño desacoplado (DDD)
 * ---------------------------------------------------
 * Administra la persistencia de la tabla `carts` y delega las consultas de
 * bloqueos de butacas, funciones y películas a los DAOs exportados por sus
 * respectivos Bounded Contexts (`SeatDao`, `FunctionDao`, `MovieDao`).
 */
@Injectable()
export class CartDao {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    private readonly seatDao: SeatDao,
    private readonly functionDao: FunctionDao,
    private readonly movieDao: MovieDao,
  ) {}

  findById(id: string): Promise<Cart | null> {
    return this.cartRepository.findOne({ where: { id } });
  }

  /** RN-044: a user may only have one ACTIVE cart at a time. */
  findActiveByUserId(userId: number): Promise<Cart | null> {
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
    return this.seatDao.findLocksByCartId(cartId);
  }

  deleteLocksByCartId(cartId: string): Promise<number> {
    return this.seatDao.deleteLocksByCartId(cartId);
  }

  findFunctionsByIds(functionIds: string[]): Promise<CinemaFunction[]> {
    return this.functionDao.findByIds(functionIds);
  }

  findMoviesByIds(movieIds: string[]): Promise<Movie[]> {
    return this.movieDao.findByIds(movieIds);
  }
}
