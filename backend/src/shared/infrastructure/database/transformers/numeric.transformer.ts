import type { ValueTransformer } from 'typeorm';

/**
 * ValueTransformer de TypeORM para columnas 'numeric' / 'decimal' de PostgreSQL,
 * las cuales son retornadas como strings por el driver pg para evitar pérdida de precisión.
 */
export const numericPriceTransformer: ValueTransformer = {
  to: (value?: number): number | undefined => value,
  from: (value?: string | number | null): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  },
};
