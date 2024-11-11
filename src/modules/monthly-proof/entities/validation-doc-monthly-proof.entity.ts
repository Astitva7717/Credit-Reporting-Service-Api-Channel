import { MonthlyProofStatusEnum } from "@utils/enums/Status";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({
	name: "sb_crs_validation_doc_monthly_proof"
})
export class ValidationDocMonthlyProof {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	userId: number;

	@Column({ nullable: true })
	masterProofId: number;

	@Column({ length: 50, nullable: true })
	monthlyProofType: string;

	@Column({ nullable: true })
	receipt: string;

	@Column({ nullable: true })
	proofPath: string;

	@Column({ nullable: true })
	proofDetail: string;

	@Column({ type: "datetime", nullable: true })
	transactionDate: Date;

	@Column({ nullable: true })
	fiRefNo: string;

	@Column({ type: "decimal", precision: 10, scale: 2 })
	amount: number;

	@Column({ nullable: true })
	reportingMonth: string;

	@Column({ nullable: true })
	reportingYear: number;

	@CreateDateColumn({ nullable: true, type: Date })
	reportingDuration: string;

	@Column({ type: "bigint", nullable: true })
	disputeHistoryId: number;

	@Column({ type: "bigint", nullable: true })
	disputeId: number;

	@Column({ nullable: true, type: "enum", enum: MonthlyProofStatusEnum })
	status: MonthlyProofStatusEnum;

	@Column({ type: "tinyint", nullable: true })
	rejectedReason: number | null;

	@Column({ type: "text", nullable: true })
	remark: string;

	@Column()
	lastFetchDate: Date;

	@Column()
	fetchTill: Date;

	@Column({ nullable: true })
	verifiedBy: number;

	@CreateDateColumn({ nullable: true })
	verifiedAt: Date;

	@CreateDateColumn({ nullable: true })
	createdAt: Date;

	@UpdateDateColumn({ nullable: true })
	updatedAt: Date;

	@Column({ type: "varchar", length: 250, nullable: true })
	creditors: string | null;

	constructor(
		userId: number,
		masterProofId: number = null,
		monthlyProofType: string = null,
		amount: number = null,
		reportingDuration: string = null,
		status: MonthlyProofStatusEnum = null
	) {
		this.userId = userId;
		this.masterProofId = masterProofId;
		this.monthlyProofType = monthlyProofType;
		this.amount = amount;
		this.reportingDuration = reportingDuration;
		this.status = status;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}

	updateProofUrl(proofPath: string) {
		this.proofPath = proofPath;
		this.updatedAt = new Date();
	}

	updateProofDetails(proofDetail: string) {
		this.proofDetail = proofDetail;
		this.updatedAt = new Date();
	}

	updateVerifingUserData(verifiedBy: number) {
		this.verifiedAt = new Date();
		this.verifiedBy = verifiedBy;
		this.updatedAt = new Date();
	}

	updateProofStatus(status: MonthlyProofStatusEnum) {
		this.status = status;
		this.updatedAt = new Date();
	}

	updateRefdocDueDates(reportingMonth: string, reportingYear: number) {
		this.reportingMonth = reportingMonth;
		this.reportingYear = reportingYear;
	}

	updateRejectedReasonId(rejectedReason: number) {
		this.rejectedReason = rejectedReason;
	}

	addDisputeId(disputeId: number) {
		this.disputeId = disputeId;
		this.updatedAt = new Date();
	}
}
