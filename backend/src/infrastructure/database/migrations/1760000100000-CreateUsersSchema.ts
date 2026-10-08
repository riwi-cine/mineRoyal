import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersSchema1760000100000 implements MigrationInterface {
  name = 'CreateUsersSchema1760000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar', length: '120' },
          { name: 'email', type: 'varchar', length: '254', isUnique: true },
          { name: 'password_hash', type: 'varchar', length: '255' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users', true, true, true);
  }
}
