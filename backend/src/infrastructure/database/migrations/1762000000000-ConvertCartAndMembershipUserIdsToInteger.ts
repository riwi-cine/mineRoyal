import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligns `carts.user_id` and `memberships.user_id` with `users.id`, which was
 * converted from UUID to INTEGER by ConvertUserIdsToInteger1760000200000.
 *
 * Existing UUID values cannot be mapped to the new integer user IDs (the old
 * UUIDs no longer exist), so the migration aborts if any row is present
 * instead of silently discarding data. Clean those tables manually first.
 */
export class ConvertCartAndMembershipUserIdsToInteger1762000000000 implements MigrationInterface {
  name = 'ConvertCartAndMembershipUserIdsToInteger1762000000000';

  private readonly tables = ['carts', 'memberships'] as const;

  private async upgradeTable(queryRunner: QueryRunner, tableName: string): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const columnType = table?.findColumnByName('user_id')?.type;

    if (!table || !columnType) {
      throw new Error(`No se encontró la columna user_id en la tabla ${tableName}.`);
    }
    if (columnType === 'integer') return;
    if (columnType !== 'uuid') {
      throw new Error(`Tipo de user_id no soportado en ${tableName}: ${columnType}.`);
    }

    const [{ count }] = (await queryRunner.query(`SELECT COUNT(*)::int AS count FROM "${tableName}"`)) as Array<{
      count: number;
    }>;
    if (count > 0) {
      throw new Error(
        `La tabla ${tableName} tiene ${count} registros con user_id UUID que no pueden convertirse a INTEGER. ` +
          'Elimínelos o migrelos manualmente antes de ejecutar esta migración.',
      );
    }

    await queryRunner.query(`ALTER TABLE "${tableName}" ALTER COLUMN "user_id" TYPE integer USING NULL`);
  }

  private async downgradeTable(queryRunner: QueryRunner, tableName: string): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (table?.findColumnByName('user_id')?.type !== 'integer') return;

    const [{ count }] = (await queryRunner.query(`SELECT COUNT(*)::int AS count FROM "${tableName}"`)) as Array<{
      count: number;
    }>;
    if (count > 0) {
      throw new Error(
        `La tabla ${tableName} tiene registros; no se puede revertir user_id a UUID sin pérdida de datos.`,
      );
    }

    await queryRunner.query(`ALTER TABLE "${tableName}" ALTER COLUMN "user_id" TYPE uuid USING NULL`);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await Promise.all(this.tables.map((table) => this.upgradeTable(queryRunner, table)));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await Promise.all(this.tables.map((table) => this.downgradeTable(queryRunner, table)));
  }
}
