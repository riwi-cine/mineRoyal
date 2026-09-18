import { MigrationInterface, QueryRunner, Table, TableUnique } from 'typeorm';

export class CreateUserSchema1761000000000 implements MigrationInterface {
  name = 'CreateUserSchema1761000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'name', type: 'varchar', length: '150' },
          { name: 'email', type: 'varchar', length: '255' },
          { name: 'password', type: 'varchar', length: '255' },
        ],
        uniques: [new TableUnique({ columnNames: ['email'] })],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users', true, true, true);
  }
}
