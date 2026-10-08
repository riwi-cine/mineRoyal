/**
 * Objeto de valor y utilitario de cálculo de tarifas para funciones y butacas (DDD).
 * Centraliza la política de precio unitario: tarifa base de la función + recargo de la sala.
 */
export function calculateSeatUnitPrice(
  basePrice: number | string | null | undefined,
  roomExtraPrice: number | string | null | undefined,
): number {
  const base = Number(basePrice ?? 0);
  const extra = Number(roomExtraPrice ?? 0);
  const validBase = Number.isFinite(base) ? base : 0;
  const validExtra = Number.isFinite(extra) ? extra : 0;
  return Math.max(0, validBase + validExtra);
}
