import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

/**
 * HU-011 — Administración del Carrito de Compras.
 *
 * Creates the `carts` table (never migrated before this HU, even though the
 * entity already existed) plus every table introduced by this feature:
 * the confectionery catalog, its cart line items, promotions, gift cards and
 * their cart attachments, and user memberships.
 *
 * Cross-aggregate references (`cart_id`, `user_id`) are intentionally plain
 * UUID columns without a foreign key, matching the convention already used
 * by `seat_locks.cart_id` and `tickets.order_id`.
 */
export class CreateCartAdministrationSchema1761000000000 implements MigrationInterface {
  name = 'CreateCartAdministrationSchema1761000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'carts',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'user_id', type: 'uuid' },
          { name: 'status', type: 'varchar', length: '30', default: "'ACTIVE'" },
          { name: 'membership_applied', type: 'boolean', default: false },
          { name: 'expires_at', type: 'timestamptz' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );
    // RN-044: only one ACTIVE cart per user.
    await queryRunner.createIndex(
      'carts',
      new TableIndex({
        name: 'carts_user_active_uq',
        columnNames: ['user_id'],
        isUnique: true,
        where: "status = 'ACTIVE'",
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar', length: '150' },
          { name: 'image_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'price', type: 'numeric', precision: 10, scale: 2 },
          { name: 'stock', type: 'int', default: 0 },
          { name: 'active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'cart_concession_items',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'cart_id', type: 'uuid' },
          { name: 'product_id', type: 'uuid' },
          { name: 'quantity', type: 'int' },
          { name: 'unit_price', type: 'numeric', precision: 10, scale: 2 },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      'cart_concession_items',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createUniqueConstraint(
      'cart_concession_items',
      new TableUnique({ columnNames: ['cart_id', 'product_id'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'promotions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'code', type: 'varchar', length: '50', isUnique: true },
          { name: 'name', type: 'varchar', length: '150' },
          { name: 'product_id', type: 'uuid', isNullable: true },
          { name: 'discount_type', type: 'varchar', length: '20' },
          { name: 'discount_value', type: 'numeric', precision: 10, scale: 2 },
          { name: 'combinable', type: 'boolean', default: true },
          { name: 'active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      'promotions',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'gift_cards',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'code', type: 'varchar', length: '50', isUnique: true },
          { name: 'balance', type: 'numeric', precision: 10, scale: 2 },
          { name: 'active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'cart_gift_cards',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'cart_id', type: 'uuid' },
          { name: 'gift_card_id', type: 'uuid' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      'cart_gift_cards',
      new TableForeignKey({
        columnNames: ['gift_card_id'],
        referencedTableName: 'gift_cards',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createUniqueConstraint(
      'cart_gift_cards',
      new TableUnique({ columnNames: ['cart_id', 'gift_card_id'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'memberships',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'user_id', type: 'uuid', isUnique: true },
          { name: 'tier', type: 'varchar', length: '30' },
          { name: 'discount_percent', type: 'numeric', precision: 5, scale: 2 },
          { name: 'active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('memberships', true, true, true);
    await queryRunner.dropTable('cart_gift_cards', true, true, true);
    await queryRunner.dropTable('gift_cards', true, true, true);
    await queryRunner.dropTable('promotions', true, true, true);
    await queryRunner.dropTable('cart_concession_items', true, true, true);
    await queryRunner.dropTable('products', true, true, true);
    await queryRunner.dropIndex('carts', 'carts_user_active_uq');
    await queryRunner.dropTable('carts', true, true, true);
  }
}
