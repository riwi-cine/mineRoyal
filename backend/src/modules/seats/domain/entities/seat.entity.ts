import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('seats')
export class Seats {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId!: string;

  @Column({ type: 'varchar', length: 5 })
  row!: string;

  @Column({ type: 'varchar', length: 5 })
  number!: string;

  @Column({ name: 'seat_type', type: 'varchar', length: 30 })
  seatType!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
