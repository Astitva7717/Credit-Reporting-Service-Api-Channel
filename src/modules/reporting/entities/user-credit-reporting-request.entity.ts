import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum ReportingStatus {
	AMOUNT_DUE = "AMOUNT_DUE",
	READY_FOR_REPORTING = "READY_FOR_REPORTING",
	REPORTING_INITIATED = "REPORTING_INITIATED",
	REPORTED = "REPORTED",
	SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED",
	LATE_PAYMENT = "LATE_PAYMENT"
}

@Entity({ name: "sb_crs_user_credit_reporting_requests" })
export class UserCreditReportingRequests {
	@PrimaryGeneratedColumn({ type: "bigint" })
	id: number;

	@Column({ type: "bigint" })
	userId: number;

	@Column({ type: "bigint" })
	scheduleId: number;

	@Column({ type: "bigint" })
	refdocId: number;

	@Column({ type: "double", precision: 10, scale: 2 })
	approvedAmount: number;
	
	@Column({ type: "enum", enum: ReportingStatus, default: ReportingStatus.AMOUNT_DUE })
	status: ReportingStatus;

	@CreateDateColumn({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
	createdAt: Date;

	@UpdateDateColumn({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
	updatedAt: Date;

	constructor(userId: number, scheduleId: number, refdocId: number, status: ReportingStatus) {
		this.userId = userId;
		this.scheduleId = scheduleId;
		this.refdocId = refdocId;
		this.approvedAmount = 0;
		this.status = status;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}

	updateApprovedAmount(approvedAmount: number) {
		this.approvedAmount = approvedAmount;
		this.updatedAt = new Date();
	}

	updateStatus(status: ReportingStatus) {
		this.status = status;
		this.updatedAt = new Date();
	}
}
