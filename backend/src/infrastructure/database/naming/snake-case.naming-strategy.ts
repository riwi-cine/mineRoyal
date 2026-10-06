import { DefaultNamingStrategy } from 'typeorm';

// Función nativa ligera para convertir a snake_case sin romper los imports
function toSnakeCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

/** Converts entity/column/relation names to snake_case for DB identifiers. */
export class SnakeCaseNamingStrategy extends DefaultNamingStrategy {
  tableName(className: string, customName?: string): string {
    return customName ?? toSnakeCase(className);
  }

  columnName(propertyName: string, customName?: string, embeddedPrefixes: string[] = []): string {
    return toSnakeCase(embeddedPrefixes.concat(customName ?? propertyName).join('_'));
  }

  relationName(propertyName: string): string {
    return toSnakeCase(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return toSnakeCase(`${relationName}_${referencedColumnName}`);
  }

  joinTableName(firstTableName: string, secondTableName: string): string {
    return toSnakeCase(`${firstTableName}_${secondTableName}`);
  }
}
