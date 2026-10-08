import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FunctionsModule } from '../functions/functions.module.js';
import { MoviesModule } from '../movies/movies.module.js';
import { PromotionsModule } from '../promotions/promotions.module.js';
import { SeatModule } from '../seats/seat.module.js';
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
    TypeOrmModule.forFeature([Cart, Product, CartConcessionItem, CartGiftCard]),
    UsersModule,
    PromotionsModule,
    SeatModule,
    FunctionsModule,
    MoviesModule,
  ],
  controllers: [CartController],
  providers: [CartDao, CartItemDao, CartService],
  exports: [CartDao, CartItemDao],
})
export class CartModule {}
