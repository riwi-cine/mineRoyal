import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CinemaFunction } from '../functions/entities/function.entity.js';
import { FunctionType } from '../functions/entities/function-type.entity.js';
import { Movie } from '../movies/entities/movie.entity.js';
import { PromotionsModule } from '../promotions/promotions.module.js';
import { Room } from '../seats/entities/room.entity.js';
import { SeatLock } from '../seats/entities/seat-lock.entity.js';
import { Seats } from '../seats/entities/seat.entity.js';
import { UsersModule } from '../users/users.module.js';
import { Cart } from './entities/cart.entity.js';
import { CartConcessionItem } from './entities/cart-concession-item.entity.js';
import { CartGiftCard } from './entities/cart-gift-card.entity.js';
import { Product } from './entities/product.entity.js';
import { CartItemDao } from './dao/cart-item.dao.js';
import { CartDao } from './dao/cart.dao.js';
import { CartService } from './services/cart.service.js';
import { CartController } from './controllers/cart.controller.js';

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
  providers: [CartDao, CartItemDao, CartService],
  exports: [CartDao, CartItemDao],
})
export class CartModule {}
