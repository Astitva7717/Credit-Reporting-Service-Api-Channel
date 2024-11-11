import { Status } from '@utils/enums/Status';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'sb_crs_money_order_sources' })
export class MoneyOrderSource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  source: string;

  @Column({ type: "enum", enum: Status, default: Status.ACTIVE })
  status: Status;

  constructor(source: string = null, status: Status = null){
      this.source = source
      this.status = status
  };
}