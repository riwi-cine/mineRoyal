import { Body, Controller, Delete, Get, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CartService } from '../../application/services/cart.service.js';
import {
  ApplyGiftCardDto,
  CartIdDto,
  CartResponse,
  CreateCartDto,
  DeleteCartResult,
  UpdateCartDto,
} from '../../application/dtos/cart.dto.js';

/**
 * HU-011 — Administración del Carrito de Compras.
 */
@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @ApiOperation({
    summary: 'Crea el carrito temporal del usuario tras seleccionar sillas, o devuelve el ya activo (RN-044).',
  })
  @ApiBody({ type: CreateCartDto })
  @ApiResponse({ status: 201, description: 'Carrito creado o recuperado.' })
  createCart(@Body() dto: CreateCartDto): Promise<CartResponse> {
    return this.cartService.createOrGetCart(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtiene el carrito con sus entradas, confitería y resumen económico.' })
  @ApiQuery({ name: 'cartId', description: 'Identificador del carrito', type: String })
  @ApiResponse({ status: 200, description: 'Detalle del carrito.' })
  @ApiResponse({ status: 404, description: 'Carrito no encontrado.' })
  getCart(@Query('cartId', ParseUUIDPipe) cartId: string): Promise<CartResponse> {
    return this.cartService.getCart(cartId);
  }

  @Put()
  @ApiOperation({ summary: 'Agrega, actualiza o elimina (cantidad 0) productos de confitería del carrito.' })
  @ApiBody({ type: UpdateCartDto })
  @ApiResponse({ status: 200, description: 'Carrito actualizado.' })
  @ApiResponse({ status: 400, description: 'Producto agotado, inactivo, o cantidad inválida.' })
  @ApiResponse({ status: 404, description: 'Carrito o producto no encontrado.' })
  @ApiResponse({ status: 410, description: 'El carrito ya no está activo (expirado, cancelado o convertido).' })
  updateCart(@Body() dto: UpdateCartDto): Promise<CartResponse> {
    return this.cartService.updateCart(dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Vacía y cancela el carrito, liberando las sillas bloqueadas (RN-045).' })
  @ApiBody({ type: CartIdDto })
  @ApiResponse({ status: 200, description: 'Carrito cancelado y sillas liberadas.' })
  @ApiResponse({ status: 404, description: 'Carrito no encontrado.' })
  deleteCart(@Body() dto: CartIdDto): Promise<DeleteCartResult> {
    return this.cartService.deleteCart(dto);
  }

  @Post('apply-membership')
  @ApiOperation({ summary: 'Aplica automáticamente el descuento de membresía del usuario a las entradas (RN-047).' })
  @ApiBody({ type: CartIdDto })
  @ApiResponse({ status: 200, description: 'Descuento de membresía aplicado.' })
  @ApiResponse({ status: 404, description: 'Carrito no encontrado, o el usuario no tiene una membresía activa.' })
  @ApiResponse({ status: 410, description: 'El carrito ya no está activo.' })
  applyMembership(@Body() dto: CartIdDto): Promise<CartResponse> {
    return this.cartService.applyMembership(dto);
  }

  @Post('apply-giftcard')
  @ApiOperation({ summary: 'Valida y adjunta un bono al carrito.' })
  @ApiBody({ type: ApplyGiftCardDto })
  @ApiResponse({ status: 200, description: 'Bono aplicado.' })
  @ApiResponse({ status: 400, description: 'El bono no tiene saldo disponible.' })
  @ApiResponse({ status: 404, description: 'Carrito o bono no encontrado.' })
  @ApiResponse({ status: 410, description: 'El carrito ya no está activo.' })
  applyGiftCard(@Body() dto: ApplyGiftCardDto): Promise<CartResponse> {
    return this.cartService.applyGiftCard(dto);
  }
}
