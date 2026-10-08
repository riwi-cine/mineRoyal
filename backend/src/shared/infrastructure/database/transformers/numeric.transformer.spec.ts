import { describe, expect, it } from 'vitest';
import { numericPriceTransformer } from './numeric.transformer.js';

describe('numericPriceTransformer', () => {
  it('to() retorna el valor tal cual', () => {
    expect(numericPriceTransformer.to(12000)).toBe(12000);
    expect(numericPriceTransformer.to(undefined)).toBeUndefined();
  });

  it('from() maneja números directos', () => {
    expect(numericPriceTransformer.from(15500)).toBe(15500);
  });

  it('from() parsea strings numéricos correctamente', () => {
    expect(numericPriceTransformer.from('25000.50')).toBe(25000.5);
  });

  it('from() retorna 0 cuando recibe null o undefined', () => {
    expect(numericPriceTransformer.from(null)).toBe(0);
    expect(numericPriceTransformer.from(undefined)).toBe(0);
  });

  it('from() retorna 0 cuando el string no es numérico', () => {
    expect(numericPriceTransformer.from('not-a-number')).toBe(0);
  });
});
