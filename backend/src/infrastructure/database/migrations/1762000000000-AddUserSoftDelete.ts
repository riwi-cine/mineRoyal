import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserSoftDelete1762000000000 implements MigrationInterface {
  name = 'AddUserSoftDelete1762000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'deleted_at');
  }
}
