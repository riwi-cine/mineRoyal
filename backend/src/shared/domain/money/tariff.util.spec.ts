import { describe, expect, it } from 'vitest';
import { calculateSeatUnitPrice } from './tariff.util.js';

describe('calculateSeatUnitPrice', () => {
  it('debe calcular correctamente con valores numéricos válidos', () => {
    expect(calculateSeatUnitPrice(15000, 5000)).toBe(20000);
  });

  it('debe calcular con strings numéricos válidos', () => {
    expect(calculateSeatUnitPrice('15000', '5000')).toBe(20000);
  });

  it('debe manejar null y undefined asignando 0 por defecto', () => {
    expect(calculateSeatUnitPrice(null, undefined)).toBe(0);
    expect(calculateSeatUnitPrice(10000, null)).toBe(10000);
    expect(calculateSeatUnitPrice(undefined, 3000)).toBe(3000);
  });

  it('debe manejar valores no finitos (NaN, Infinity) retornando valores válidos', () => {
    expect(calculateSeatUnitPrice('invalido', 5000)).toBe(5000);
    expect(calculateSeatUnitPrice(10000, Number.POSITIVE_INFINITY)).toBe(10000);
    expect(calculateSeatUnitPrice(Number.NaN, Number.NaN)).toBe(0);
  });

  it('debe retornar 0 si el resultado neto fuera negativo', () => {
    expect(calculateSeatUnitPrice(-5000, -2000)).toBe(0);
  });
});
