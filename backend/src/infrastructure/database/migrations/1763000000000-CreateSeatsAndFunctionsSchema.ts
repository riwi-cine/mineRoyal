import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class CreateSeatsAndFunctionsSchema1763000000000 implements MigrationInterface {
  name = 'CreateSeatsAndFunctionsSchema1763000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tabla room_types
    await queryRunner.createTable(
      new Table({
        name: 'room_types',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar', length: '50', isUnique: true },
          { name: 'description', type: 'varchar', length: '255' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    // 2. Tabla rooms (Unificación del modelo de salas con soporte para room_type y extra_price)
    await queryRunner.createTable(
      new Table({
        name: 'rooms',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'cinema_id', type: 'uuid' },
          { name: 'room_type_id', type: 'uuid', isNullable: true },
          { name: 'name', type: 'varchar', length: '80' },
          { name: 'capacity', type: 'int' },
          { name: 'extra_price', type: 'decimal', precision: 10, scale: 2, default: 0 },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['cinema_id'],
            referencedTableName: 'cinemas',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['room_type_id'],
            referencedTableName: 'room_types',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          }),
        ],
      }),
      true,
    );

    // Backfill inicial: migrar salas históricas de cinema_rooms hacia rooms (Patrón Expand-Contract)
    const hasCinemaRooms = await queryRunner.hasTable('cinema_rooms');
    if (hasCinemaRooms) {
      await queryRunner.query(`
        INSERT INTO rooms (id, cinema_id, name, capacity, extra_price, created_at, updated_at)
        SELECT id, cinema_id, name, capacity, 0, created_at, updated_at
        FROM cinema_rooms
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    // 3. Tabla seats
    await queryRunner.createTable(
      new Table({
        name: 'seats',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'room_id', type: 'uuid' },
          { name: 'row', type: 'varchar', length: '5' },
          { name: 'number', type: 'varchar', length: '5' },
          { name: 'seat_type', type: 'varchar', length: '30' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['room_id'],
            referencedTableName: 'rooms',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
        uniques: [
          new TableUnique({
            columnNames: ['room_id', 'row', 'number'],
          }),
        ],
      }),
      true,
    );

    // 4. Tabla function_types
    await queryRunner.createTable(
      new Table({
        name: 'function_types',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar', length: '100' },
          { name: 'projection', type: 'varchar', length: '50' },
          { name: 'language', type: 'varchar', length: '50' },
          { name: 'audio_type', type: 'varchar', length: '20' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // 5. Tabla functions
    await queryRunner.createTable(
      new Table({
        name: 'functions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'movie_id', type: 'uuid' },
          { name: 'room_id', type: 'uuid' },
          { name: 'function_type_id', type: 'uuid', isNullable: true },
          { name: 'starts_at', type: 'timestamptz' },
          { name: 'base_price', type: 'decimal', precision: 10, scale: 2 },
          { name: 'active', type: 'boolean', default: true },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['movie_id'],
            referencedTableName: 'movies',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['room_id'],
            referencedTableName: 'rooms',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['function_type_id'],
            referencedTableName: 'function_types',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          }),
        ],
      }),
      true,
    );

    // Backfill inicial: migrar funciones históricas de movie_functions hacia functions
    const hasMovieFunctions = await queryRunner.hasTable('movie_functions');
    if (hasMovieFunctions) {
      await queryRunner.query(`
        INSERT INTO functions (id, movie_id, room_id, starts_at, base_price, active)
        SELECT mf.id, mf.movie_id, mf.room_id, mf.starts_at, mf.ticket_price, true
        FROM movie_functions mf
        INNER JOIN rooms r ON r.id = mf.room_id
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    // 6. Tabla seat_locks
    await queryRunner.createTable(
      new Table({
        name: 'seat_locks',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'cart_id', type: 'uuid' },
          { name: 'function_id', type: 'uuid' },
          { name: 'seat_id', type: 'uuid' },
          { name: 'expires_at', type: 'timestamptz' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['seat_id'],
            referencedTableName: 'seats',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
        uniques: [
          new TableUnique({
            columnNames: ['function_id', 'seat_id'],
          }),
        ],
      }),
      true,
    );

    // 7. Tabla tickets
    await queryRunner.createTable(
      new Table({
        name: 'tickets',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'order_id', type: 'uuid' },
          { name: 'function_id', type: 'uuid' },
          { name: 'seat_id', type: 'uuid' },
          { name: 'holder_user_id', type: 'integer' },
          { name: 'qr_code', type: 'varchar', length: '255', isUnique: true },
          { name: 'price', type: 'decimal', precision: 10, scale: 2 },
          { name: 'status', type: 'varchar', length: '30' },
          { name: 'scanned_by_user_id', type: 'integer', isNullable: true },
          { name: 'scanned_at', type: 'timestamptz', isNullable: true },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['function_id'],
            referencedTableName: 'functions',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          }),
          new TableForeignKey({
            columnNames: ['seat_id'],
            referencedTableName: 'seats',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tickets', true);
    await queryRunner.dropTable('seat_locks', true);
    await queryRunner.dropTable('functions', true);
    await queryRunner.dropTable('function_types', true);
    await queryRunner.dropTable('seats', true);
    await queryRunner.dropTable('rooms', true);
    await queryRunner.dropTable('room_types', true);
  }
}
