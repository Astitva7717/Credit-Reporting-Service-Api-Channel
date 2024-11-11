import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Status } from './language-master.entity';

@Entity('sb_crs_dropdown_options')
export class DropdownOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  dropdownName: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  option: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  value: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  page: string;

  @Column({ 
    type: 'enum',
    enum: Status,
    default: 'ACTIVE',
    nullable: false 
  })
  status: 'ACTIVE' | 'INACTIVE';

  @CreateDateColumn({ type: 'datetime', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  constructor(dropdownName: string, option: string, value: string, page: string, status: Status){
    this.dropdownName = dropdownName
    this.option = option
    this.value = value
    this.page = page
    this.status = status
    this.createdAt = new Date()
    this.updatedAt = new Date()
  }
}
