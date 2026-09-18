import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { seatCategorySchema } from '../../domain/entities/seat.entity.js';

/** Estado de una silla dentro del mapa de la sala. */
export const seatStatusSchema = z.enum([
  'AVAILABLE', // Disponible
  'SELECTED', // Seleccionada por el carrito que realiza la consulta
  'LOCKED', // Reservada temporalmente por otro usuario
  'SOLD', // Vendida
  'DISABLED', // Inhabilitada
]);
export type SeatStatus = z.infer<typeof seatStatusSchema>;

/** Categoría de la silla, usada para la representación visual y el precio (definida en el dominio del Asiento). */
export { seatCategorySchema };
export type { SeatCategory } from '../../domain/entities/seat.entity.js';

/**
 * Esquema de una silla del mapa de la sala con su estado calculado en tiempo real.
 */
export const seatMapItemSchema = z.object({
  id: z.string().uuid(),
  row: z.string().min(1).max(5),
  number: z.string().min(1).max(5),
  category: seatCategorySchema,
  status: seatStatusSchema,
  /** Expiración del bloqueo temporal cuando la silla está LOCKED o SELECTED. */
  lockedUntil: z.date().nullable(),
});
export type SeatMapItem = z.infer<typeof seatMapItemSchema>;

/**
 * Esquema del mapa completo de la sala asociado a una función.
 */
export const seatMapSchema = z.object({
  functionId: z.string().uuid(),
  room: z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(50),
    capacity: z.coerce.number().int().nonnegative(),
  }),
  /** Número máximo de sillas que un usuario puede seleccionar en esta función. */
  maxSeatsPerReservation: z.coerce.number().int().positive(),
  availableCount: z.coerce.number().int().nonnegative(),
  seats: z.array(seatMapItemSchema),
});
export type SeatMap = z.infer<typeof seatMapSchema>;

/**
 * Esquema para el cuerpo de la petición que bloquea temporalmente un conjunto de sillas.
 */
export const lockSeatsSchema = z.object({
  functionId: z.string().uuid(),
  cartId: z.string().uuid(),
  seatIds: z.array(z.string().uuid()).min(1),
});
export class LockSeatsDto extends createZodDto(lockSeatsSchema) {}

/**
 * Esquema para el cuerpo de la petición que libera sillas bloqueadas por un carrito.
 */
export const releaseSeatsSchema = z.object({
  functionId: z.string().uuid(),
  cartId: z.string().uuid(),
  /** Si se omite, se liberan todas las sillas del carrito para esa función. */
  seatIds: z.array(z.string().uuid()).optional(),
});
export class ReleaseSeatsDto extends createZodDto(releaseSeatsSchema) {}

/**
 * Esquema del resultado del bloqueo temporal de sillas.
 */
export const lockSeatsResultSchema = z.object({
  functionId: z.string().uuid(),
  cartId: z.string().uuid(),
  lockedSeatIds: z.array(z.string().uuid()),
  /** Sillas que no se pudieron bloquear por estar vendidas o tomadas por otro usuario. */
  rejectedSeatIds: z.array(z.string().uuid()),
  /** Instante en el que expirará el bloqueo (RN-039: 10 minutos). */
  expiresAt: z.date(),
});
export type LockSeatsResult = z.infer<typeof lockSeatsResultSchema>;

/**
 * Esquema del resultado de liberar sillas de un carrito.
 */
export const releaseSeatsResultSchema = z.object({
  functionId: z.string().uuid(),
  cartId: z.string().uuid(),
  releasedCount: z.coerce.number().int().nonnegative(),
});
export type ReleaseSeatsResult = z.infer<typeof releaseSeatsResultSchema>;

/**
 * Esquema de una línea del resumen de reserva: una silla seleccionada y su precio unitario.
 */
export const reservationSummaryLineSchema = z.object({
  seatId: z.string().uuid(),
  row: z.string().min(1).max(5),
  number: z.string().min(1).max(5),
  category: seatCategorySchema,
  unitPrice: z.coerce.number().nonnegative(),
});
export type ReservationSummaryLine = z.infer<typeof reservationSummaryLineSchema>;

/**
 * Esquema del resumen económico de las sillas seleccionadas antes de continuar al carrito.
 */
export const reservationSummarySchema = z.object({
  functionId: z.string().uuid(),
  cartId: z.string().uuid(),
  seatCount: z.coerce.number().int().nonnegative(),
  basePrice: z.coerce.number().nonnegative(),
  roomExtraPrice: z.coerce.number().nonnegative(),
  unitPrice: z.coerce.number().nonnegative(),
  total: z.coerce.number().nonnegative(),
  /** Expiración más próxima entre las sillas bloqueadas (null si no hay sillas). */
  expiresAt: z.date().nullable(),
  lines: z.array(reservationSummaryLineSchema),
});
export type ReservationSummary = z.infer<typeof reservationSummarySchema>;
