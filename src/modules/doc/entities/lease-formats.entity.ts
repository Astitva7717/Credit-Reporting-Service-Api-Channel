import { Status } from '@utils/enums/Status';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'sb_crs_lease_formats' })
export class LeaseFormats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  format: string;

  @Column({ type: "enum", enum: Status, default: Status.ACTIVE })
  status: Status;

  constructor(format: string = null, status: Status = null){
      this.format = format
      this.status = status
  };
}