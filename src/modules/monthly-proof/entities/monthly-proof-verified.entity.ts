
import { VerifiedProofStatusEnum } from '@utils/enums/Status';
import { Entity, PrimaryGeneratedColumn, Column} from 'typeorm';

@Entity({
	name: 'sb_crs_monthly_verified_proofs'
})
export class MonthlyVerifiedProofsEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'bigint', unsigned: true, nullable: false })
  scheduleId: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  masterProofId: number;

  @Column({ type: 'varchar', length: 50, default: '', comment: 'TRANSACTION/RECEIPT' })
  monthlyProofType: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  proofPath: string;

  @Column({ type: 'datetime', nullable: true })
  transactionDate: Date;

  @Column({ type: 'text', nullable: true })
  proofDetail: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'fi_ref_no', comment: 'financial_institution_ref_no' })
  fiRefNo: string;

  @Column({ type: 'double', precision: 10, scale: 2, nullable: true })
  approvedAmount: number;

  @Column({ type: 'varchar', length: 5, nullable: true })
  reportingMonth: string;

  @Column({ type: 'smallint', nullable: true })
  reportingYear: number;

  @Column({ nullable: true, type: "enum", enum: VerifiedProofStatusEnum })
	status: VerifiedProofStatusEnum;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  verifiedBy: number;

  @Column({ type: 'datetime', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  constructor(
    userId: number,
    scheduleId: number = null,
    masterProofId: number = null,
    monthlyProofType: string = null,
    proofPath: string = null,
    transactionDate: Date = null,
    proofDetail: string = null
) {
    this.userId = userId;
    this.scheduleId = scheduleId;
    this.masterProofId = masterProofId;
    this.monthlyProofType = monthlyProofType;
    this.proofPath = proofPath;
    this.transactionDate = transactionDate;
    this.proofDetail = proofDetail
    this.createdAt = new Date();
    this.updatedAt = new Date();
}
}
