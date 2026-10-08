import { Body, Controller, Delete, Get, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CartService } from '../services/cart.service.js';
import {
  ApplyGiftCardDto,
  CartIdDto,
  CartResponse,
  CreateCartDto,
  DeleteCartResult,
  UpdateCartDto,
} from '../dtos/cart.dto.js';

/**
 * Controlador para la administración del carrito de compras (HU-011).
 *
 * Administra el ciclo de vida del carrito temporal del usuario: creación,
 * consulta de entradas y confitería, adición/modificación de productos,
 * cancelación y liberación de sillas (RN-045), así como la aplicación de
 * beneficios por membresía (RN-047) y bonos/tarjetas de regalo.
 */
@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Crea un nuevo carrito temporal para el usuario o recupera el que ya tenga activo.
   *
   * Implementa la regla RN-044 garantizando la unicidad del carrito activo por usuario.
   *
   * @param dto Datos con el identificador del usuario y opcionalmente un UUID de carrito preasignado.
   * @returns El carrito activo con sus entradas, confitería y resumen financiero.
   * @throws BadRequestException Si los datos de entrada no cumplen con el esquema de validación.
   */
  @Post()
  @ApiOperation({
    summary: 'Crea el carrito temporal del usuario tras seleccionar sillas, o devuelve el ya activo (RN-044).',
  })
  @ApiBody({ type: CreateCartDto })
  @ApiResponse({ status: 201, description: 'Carrito creado o recuperado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de la petición inválidos.' })
  createCart(@Body() dto: CreateCartDto): Promise<CartResponse> {
    return this.cartService.createOrGetCart(dto);
  }

  /**
   * Obtiene la información completa de un carrito de compras.
   *
   * Retorna el detalle de las entradas (sillas bloqueadas por HU-010),
   * productos de confitería, promociones aplicadas, descuentos y total a pagar.
   *
   * @param cartId Identificador UUID del carrito de compras.
   * @returns Información consolidada y resumen de costos del carrito.
   * @throws BadRequestException Si el identificador no es un UUID válido.
   * @throws NotFoundException Si el carrito no existe en la base de datos.
   */
  @Get()
  @ApiOperation({ summary: 'Obtiene el carrito con sus entradas, confitería y resumen económico.' })
  @ApiQuery({ name: 'cartId', description: 'Identificador UUID del carrito', type: String })
  @ApiResponse({ status: 200, description: 'Detalle del carrito y desglose de valores.' })
  @ApiResponse({ status: 400, description: 'Identificador de carrito no válido (debe ser UUID).' })
  @ApiResponse({ status: 404, description: 'Carrito no encontrado.' })
  getCart(@Query('cartId', ParseUUIDPipe) cartId: string): Promise<CartResponse> {
    return this.cartService.getCart(cartId);
  }

  /**
   * Agrega, actualiza o elimina productos de confitería en el carrito.
   *
   * Enviar cantidad 0 en un ítem remueve el producto del carrito.
   * Valida la existencia, stock disponible y estado activo del producto.
   *
   * @param dto Objeto con el identificador del carrito y lista de ítems de confitería.
   * @returns El carrito actualizado con los nuevos subtotales calculados.
   * @throws BadRequestException Si la cantidad es negativa o el producto no tiene disponibilidad.
   * @throws NotFoundException Si el carrito o el producto no existen.
   * @throws GoneException (HTTP 410) Si el carrito expiró (RN-046), fue cancelado o convertido en orden.
   */
  @Put()
  @ApiOperation({ summary: 'Agrega, actualiza o elimina (cantidad 0) productos de confitería del carrito.' })
  @ApiBody({ type: UpdateCartDto })
  @ApiResponse({ status: 200, description: 'Carrito y productos de confitería actualizados.' })
  @ApiResponse({ status: 400, description: 'Producto agotado, inactivo, o cantidad inválida.' })
  @ApiResponse({ status: 404, description: 'Carrito o producto no encontrado.' })
  @ApiResponse({ status: 410, description: 'El carrito ya no está activo (expirado, cancelado o convertido).' })
  updateCart(@Body() dto: UpdateCartDto): Promise<CartResponse> {
    return this.cartService.updateCart(dto);
  }

  /**
   * Vacía y cancela el carrito de compras, liberando automáticamente las sillas retenidas.
   *
   * Cumple con la regla RN-045 para evitar bloqueos huérfanos al cancelar una compra.
   *
   * @param dto Objeto que contiene el identificador UUID del carrito a cancelar.
   * @returns Confirmación de cancelación del carrito y número de sillas liberadas.
   * @throws BadRequestException Si el identificador no es un UUID válido.
   * @throws NotFoundException Si el carrito no existe.
   */
  @Delete()
  @ApiOperation({ summary: 'Vacía y cancela el carrito, liberando las sillas bloqueadas (RN-045).' })
  @ApiBody({ type: CartIdDto })
  @ApiResponse({ status: 200, description: 'Carrito cancelado y sillas liberadas exitosamente.' })
  @ApiResponse({ status: 400, description: 'Identificador de carrito no válido.' })
  @ApiResponse({ status: 404, description: 'Carrito no encontrado.' })
  deleteCart(@Body() dto: CartIdDto): Promise<DeleteCartResult> {
    return this.cartService.deleteCart(dto);
  }

  /**
   * Aplica el descuento por membresía activa del usuario a las entradas del carrito.
   *
   * Cumple con la regla RN-047 otorgando los beneficios tarifarios correspondientes.
   *
   * @param dto Objeto que contiene el identificador UUID del carrito.
   * @returns El carrito con el descuento de membresía recalculado.
   * @throws NotFoundException Si el carrito no existe o el usuario no posee una membresía activa vigente.
   * @throws GoneException (HTTP 410) Si el carrito expiró o no se encuentra en estado ACTIVE.
   */
  @Post('apply-membership')
  @ApiOperation({ summary: 'Aplica automáticamente el descuento de membresía del usuario a las entradas (RN-047).' })
  @ApiBody({ type: CartIdDto })
  @ApiResponse({ status: 200, description: 'Descuento de membresía aplicado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Identificador de carrito no válido.' })
  @ApiResponse({ status: 404, description: 'Carrito no encontrado, o el usuario no tiene una membresía activa.' })
  @ApiResponse({ status: 410, description: 'El carrito ya no está activo.' })
  applyMembership(@Body() dto: CartIdDto): Promise<CartResponse> {
    return this.cartService.applyMembership(dto);
  }

  /**
   * Aplica un bono de regalo (giftcard) como método de pago o descuento en el carrito.
   *
   * Valida la existencia del código, su vigencia y que cuente con saldo disponible.
   *
   * @param dto Objeto con el identificador del carrito y el código del bono.
   * @returns El carrito con el bono aplicado y el nuevo total a pagar.
   * @throws BadRequestException Si el bono no tiene saldo disponible o los datos son inválidos.
   * @throws NotFoundException Si el carrito o el bono especificado no existen.
   * @throws GoneException (HTTP 410) Si el carrito ya no está activo.
   */
  @Post('apply-giftcard')
  @ApiOperation({ summary: 'Valida y adjunta un bono al carrito.' })
  @ApiBody({ type: ApplyGiftCardDto })
  @ApiResponse({ status: 200, description: 'Bono aplicado exitosamente.' })
  @ApiResponse({ status: 400, description: 'El bono no tiene saldo disponible o formato inválido.' })
  @ApiResponse({ status: 404, description: 'Carrito o bono no encontrado.' })
  @ApiResponse({ status: 410, description: 'El carrito ya no está activo.' })
  applyGiftCard(@Body() dto: ApplyGiftCardDto): Promise<CartResponse> {
    return this.cartService.applyGiftCard(dto);
  }
}
