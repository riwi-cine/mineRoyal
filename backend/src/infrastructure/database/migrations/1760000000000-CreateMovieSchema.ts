import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class CreateMovieSchema1760000000000 implements MigrationInterface {
  name = 'CreateMovieSchema1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'directors',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar', length: '120', isUnique: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'genres',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar', length: '60', isUnique: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'actors',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar', length: '120' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'languages',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar', length: '60', isUnique: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'formats',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar', length: '20', isUnique: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'movies',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'title', type: 'varchar', length: '200' },
          { name: 'poster_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'banner_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'trailer_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'synopsis', type: 'text' },
          { name: 'duration_minutes', type: 'int' },
          { name: 'classification', type: 'varchar', length: '10' },
          { name: 'release_date', type: 'date' },
          { name: 'rating', type: 'double precision', default: 0 },
          { name: 'director_id', type: 'uuid' },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      'movies',
      new TableForeignKey({
        columnNames: ['director_id'],
        referencedTableName: 'directors',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Junction tables
    await queryRunner.createTable(
      new Table({
        name: 'movie_genres',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'movie_id', type: 'uuid' },
          { name: 'genre_id', type: 'uuid' },
        ],
      }),
    );
    await queryRunner.createForeignKeys('movie_genres', [
      new TableForeignKey({
        columnNames: ['movie_id'],
        referencedTableName: 'movies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['genre_id'],
        referencedTableName: 'genres',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);
    await queryRunner.createUniqueConstraint(
      'movie_genres',
      new TableUnique({ columnNames: ['movie_id', 'genre_id'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'movie_actors',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'movie_id', type: 'uuid' },
          { name: 'actor_id', type: 'uuid' },
        ],
      }),
    );
    await queryRunner.createForeignKeys('movie_actors', [
      new TableForeignKey({
        columnNames: ['movie_id'],
        referencedTableName: 'movies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['actor_id'],
        referencedTableName: 'actors',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'movie_languages',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'movie_id', type: 'uuid' },
          { name: 'language_id', type: 'uuid' },
        ],
      }),
    );
    await queryRunner.createForeignKeys('movie_languages', [
      new TableForeignKey({
        columnNames: ['movie_id'],
        referencedTableName: 'movies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['language_id'],
        referencedTableName: 'languages',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'movie_formats',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'movie_id', type: 'uuid' },
          { name: 'format_id', type: 'uuid' },
          { name: 'price', type: 'numeric', precision: 10, scale: 2, default: 0 },
        ],
      }),
    );
    await queryRunner.createForeignKeys('movie_formats', [
      new TableForeignKey({
        columnNames: ['movie_id'],
        referencedTableName: 'movies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['format_id'],
        referencedTableName: 'formats',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);
    await queryRunner.createUniqueConstraint(
      'movie_formats',
      new TableUnique({ columnNames: ['movie_id', 'format_id'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'cinema_rooms',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'cinema_id', type: 'uuid' },
          { name: 'name', type: 'varchar', length: '80' },
          { name: 'capacity', type: 'int' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      'cinema_rooms',
      new TableForeignKey({
        columnNames: ['cinema_id'],
        referencedTableName: 'cinemas',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'movie_functions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'movie_id', type: 'uuid' },
          { name: 'cinema_id', type: 'uuid' },
          { name: 'room_id', type: 'uuid' },
          { name: 'format_id', type: 'uuid' },
          { name: 'starts_at', type: 'timestamp' },
          { name: 'ticket_price', type: 'numeric', precision: 10, scale: 2 },
          { name: 'total_seats', type: 'int' },
          { name: 'available_seats', type: 'int' },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );
    await queryRunner.createForeignKeys('movie_functions', [
      new TableForeignKey({
        columnNames: ['movie_id'],
        referencedTableName: 'movies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['cinema_id'],
        referencedTableName: 'cinemas',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['room_id'],
        referencedTableName: 'cinema_rooms',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['format_id'],
        referencedTableName: 'formats',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('movie_functions', true, true, true);
    await queryRunner.dropTable('cinema_rooms', true, true, true);
    await queryRunner.dropTable('movie_formats', true, true, true);
    await queryRunner.dropTable('movie_languages', true, true, true);
    await queryRunner.dropTable('movie_actors', true, true, true);
    await queryRunner.dropTable('movie_genres', true, true, true);
    await queryRunner.dropTable('movies', true, true, true);
    await queryRunner.dropTable('formats', true, true, true);
    await queryRunner.dropTable('languages', true, true, true);
    await queryRunner.dropTable('actors', true, true, true);
    await queryRunner.dropTable('genres', true, true, true);
    await queryRunner.dropTable('directors', true, true, true);
  }
}
