import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Function } from '../../../functions/domain/entities/function.entity.js';
import { Seats } from '../../../seats/domain/entities/seat.entity.js';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ name: 'function_id', type: 'uuid' })
  functionId!: string;

  @ManyToOne(() => Function, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'function_id' })
  function?: Function;

  @Column({ name: 'seat_id', type: 'uuid' })
  seatId!: string;

  @ManyToOne(() => Seats, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seat_id' })
  seat?: Seats;

  @Column({ name: 'holder_user_id', type: 'uuid' })
  holderUserId!: string;

  @Column({ name: 'qr_code', type: 'varchar', length: 255, unique: true })
  qrCode!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'varchar', length: 30 })
  status!: string;

  @Column({ name: 'scanned_by_user_id', type: 'uuid', nullable: true })
  scannedByUserId!: string | null;

  @Column({ name: 'scanned_at', type: 'timestamptz', nullable: true })
  scannedAt!: Date | null;
}
