import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CinemaFunction } from '../functions/domain/entities/function.entity.js';
import { FunctionType } from '../functions/domain/entities/function-type.entity.js';
import { Movie } from '../movies/domain/entities/movie.entity.js';
import { PromotionsModule } from '../promotions/promotions.module.js';
import { Room } from '../seats/domain/entities/room.entity.js';
import { SeatLock } from '../seats/domain/entities/seat-lock.entity.js';
import { Seats } from '../seats/domain/entities/seat.entity.js';
import { UsersModule } from '../users/users.module.js';
import { Cart } from './domain/entities/cart.entity.js';
import { CartConcessionItem } from './domain/entities/cart-concession-item.entity.js';
import { CartGiftCard } from './domain/entities/cart-gift-card.entity.js';
import { Product } from './domain/entities/product.entity.js';
import { CartItemRepository } from './infrastructure/dao/cart-item.repository.js';
import { CartRepository } from './infrastructure/dao/cart.repository.js';
import { CartService } from './application/services/cart.service.js';
import { CartController } from './ui/controllers/cart.controller.js';

@Module({
  imports: [
    // Room/Seats/FunctionType/Movie are registered here (not just referenced via
    // relations) so TypeORM's autoLoadEntities can build their metadata — the
    // same reasoning documented in SeatModule for cross-module relations.
    TypeOrmModule.forFeature([
      Cart,
      Product,
      CartConcessionItem,
      CartGiftCard,
      SeatLock,
      Seats,
      CinemaFunction,
      FunctionType,
      Room,
      Movie,
    ]),
    UsersModule,
    PromotionsModule,
  ],
  controllers: [CartController],
  providers: [CartRepository, CartItemRepository, CartService],
  exports: [CartRepository, CartItemRepository],
})
export class CartModule {}
