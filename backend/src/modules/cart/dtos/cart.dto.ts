import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { cartStatusSchema } from '../entities/cart.entity.js';

export { cartStatusSchema };
export type { CartStatus } from '../entities/cart.entity.js';

/**
 * Esquema para el cuerpo de la petición que crea (o recupera, RN-044) el carrito activo de un usuario.
 */
export const createCartDtoSchema = z.object({
  userId: z.coerce.number().int().positive(),
  /**
   * Optional id to reuse — the frontend generates a cart id before the cart
   * formally exists, to pass it to HU-010's `lock-seats` while the user is
   * still picking seats. If omitted, the server generates one.
   */
  cartId: z.string().uuid().optional(),
});
export const createCartSchema = createCartDtoSchema;
export class CreateCartDto extends createZodDto(createCartDtoSchema) {}

/**
 * Esquema de un ítem de confitería a agregar/actualizar/eliminar (cantidad 0) en el carrito.
 */
export const cartConcessionItemInputSchema = z.object({
  productId: z.string().uuid(),
  /** RN: no se permiten cantidades negativas. 0 elimina el ítem del carrito. */
  quantity: z.coerce.number().int().nonnegative(),
});
export type CartConcessionItemInputDto = z.infer<typeof cartConcessionItemInputSchema>;

/**
 * Esquema para el cuerpo de la petición que administra los productos de confitería del carrito.
 */
export const updateCartSchema = z.object({
  cartId: z.string().uuid(),
  concessionItems: z.array(cartConcessionItemInputSchema),
});
export class UpdateCartDto extends createZodDto(updateCartSchema) {}

/**
 * Esquema para el cuerpo de las peticiones que solo requieren identificar el carrito.
 */
export const cartIdSchema = z.object({
  cartId: z.string().uuid(),
});
export class CartIdDto extends createZodDto(cartIdSchema) {}

/**
 * Esquema para el cuerpo de la petición que aplica un bono al carrito.
 */
export const applyGiftCardSchema = z.object({
  cartId: z.string().uuid(),
  code: z.string().min(1).max(50),
});
export class ApplyGiftCardDto extends createZodDto(applyGiftCardSchema) {}

/**
 * Esquema de una "entrada": las sillas de una función agrupadas en una línea del carrito.
 */
export const cartTicketLineSchema = z.object({
  functionId: z.string().uuid(),
  movieTitle: z.string(),
  startsAt: z.date(),
  roomName: z.string(),
  format: z.string(),
  /** Cantidad de entradas (= número de sillas seleccionadas para esta función). */
  quantity: z.coerce.number().int().nonnegative(),
  /** Identificación de cada silla, p. ej. "A1". */
  seatLabels: z.array(z.string()),
  unitPrice: z.coerce.number().nonnegative(),
  /** Descuento de membresía aplicado a esta línea (RN-047). */
  discount: z.coerce.number().nonnegative(),
  total: z.coerce.number().nonnegative(),
  /** Expiración del bloqueo de sillas más próxima de esta función (RN-039/RN-046). */
  expiresAt: z.date().nullable(),
});
export type CartTicketLine = z.infer<typeof cartTicketLineSchema>;

/**
 * Esquema de una promoción aplicada a un ítem de confitería.
 */
export const appliedPromotionSchema = z.object({
  code: z.string(),
  name: z.string(),
  discountAmount: z.coerce.number().nonnegative(),
});
export type AppliedPromotion = z.infer<typeof appliedPromotionSchema>;

/**
 * Esquema de un ítem de confitería dentro del carrito.
 */
export const cartConcessionLineSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  promotion: appliedPromotionSchema.nullable(),
  subtotal: z.coerce.number().nonnegative(),
});
export type CartConcessionLine = z.infer<typeof cartConcessionLineSchema>;

/**
 * Esquema de un bono aplicado al carrito.
 */
export const appliedGiftCardSchema = z.object({
  code: z.string(),
  amountApplied: z.coerce.number().nonnegative(),
  remainingBalance: z.coerce.number().nonnegative(),
});
export type AppliedGiftCard = z.infer<typeof appliedGiftCardSchema>;

/**
 * Esquema del resumen económico del carrito.
 */
export const cartSummarySchema = z.object({
  subtotal: z.coerce.number().nonnegative(),
  membershipDiscount: z.coerce.number().nonnegative(),
  promotionsDiscount: z.coerce.number().nonnegative(),
  giftCardsApplied: z.coerce.number().nonnegative(),
  taxRate: z.coerce.number().nonnegative(),
  taxes: z.coerce.number().nonnegative(),
  total: z.coerce.number().nonnegative(),
});
export type CartSummary = z.infer<typeof cartSummarySchema>;

/**
 * Esquema completo de la respuesta del carrito (HU-011: entradas, confitería y resumen).
 */
export const cartResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.number().int().positive(),
  status: cartStatusSchema,
  membershipApplied: z.boolean(),
  expiresAt: z.date(),
  createdAt: z.date(),
  tickets: z.array(cartTicketLineSchema),
  concessionItems: z.array(cartConcessionLineSchema),
  appliedGiftCards: z.array(appliedGiftCardSchema),
  summary: cartSummarySchema,
});
export type CartResponse = z.infer<typeof cartResponseSchema>;

/**
 * Esquema de la respuesta al eliminar (vaciar/cancelar) un carrito.
 */
export const deleteCartResultSchema = z.object({
  cartId: z.string().uuid(),
  status: cartStatusSchema,
  releasedSeats: z.coerce.number().int().nonnegative(),
});
export type DeleteCartResult = z.infer<typeof deleteCartResultSchema>;
