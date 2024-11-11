import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum DisputeStatusEnum {
	RAISED = "RAISED",
	CUSTOMER_ACTION_PENDING = "CUSTOMER ACTION PENDING",
	CRYR_ACTION_PENDING = "CRYR ACTION PENDING",
	CLOSED = "CLOSED"
}

@Entity({ name: "sb_crs_disputes" })
export class DisputeEntity {
	@PrimaryGeneratedColumn({ type: "bigint" })
	disputeId: number;

	@Column({ type: "bigint" })
	monthlyProofId: number;

	@Column({ type: "bigint" })
	masterProofId: number;

	@Column({ length: 5 })
	reportingMonth: string;

	@Column({ type: "smallint" })
	reportingYear: number;

	@Column()
	disputeType: number;

	@Column({ type: "enum", enum: DisputeStatusEnum })
	status: DisputeStatusEnum;

	@Column({ type: "bigint" })
	raisedBy: number;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date | null;

	constructor(masterProofId: number, disputeType: number, status: DisputeStatusEnum, raisedBy: number) {
		this.masterProofId = masterProofId;
		this.disputeType = disputeType;
		this.status = status;
		this.raisedBy = raisedBy;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}

	addDisputeMonthAndYear(reportingMonth: string, reportingYear: number) {
		this.reportingMonth = reportingMonth;
		this.reportingYear = reportingYear;
	}

	updateStatus(status: DisputeStatusEnum) {
		this.status = status;
		this.updatedAt = new Date();
	}
}
