import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum UserPaymentScheduleStatus {
	NEW = "NEW",
	DUE = "DUE",
	UPLOADED = "UPLOADED",
	PARTIALLY_UPLOADED = "PARTIALLY_UPLOADED",
	DISPUTE_RAISED = "DISPUTE_RAISED",
	LOOKBACK_DATE_FETCH_PENDING = "LOOKBACK_DATE_FETCH_PENDING",
	DATA_NOT_FOUND = "DATA_NOT_FOUND",
	REPORTED = "REPORTED",
	INACTIVE = "INACTIVE",
	AMOUNT_DUE = "AMOUNT_DUE",
	READY_FOR_REPORTING = "READY_FOR_REPORTING",
	REPORTING_INITIATED = "REPORTING_INITIATED",
	SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED",
	LATE_PAYMENT = "LATE_PAYMENT"
}

@Entity({ name: "sb_crs_user_payment_schedule" })
export class UserPaymentSchedule {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	refScheduleId: number;

	@Column()
	userId: number;

	@Column({ length: 3, nullable: true })
	month: string;

	@Column({ type: "double", precision: 10, scale: 0, nullable: true })
	year: number;

	@Column({ type: "double", precision: 10, scale: 2, nullable: true })
	approvedAmount: number;

	@Column({ type: "double", precision: 10, scale: 2, nullable: true })
	latePayment: number;

	@Column({ type: "enum", enum: UserPaymentScheduleStatus, default: UserPaymentScheduleStatus.NEW })
	status: UserPaymentScheduleStatus;

	@CreateDateColumn({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
	createdAt: Date;

	@Column({ type: "bigint", nullable: true })
	createdBy: number;

	@UpdateDateColumn({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
	updatedAt: Date;

	@Column({ type: "bigint", nullable: true })
	updatedBy: number;

	constructor(
		refScheduleId: number,
		userId: number,
		month: string,
		year: number,
		status: UserPaymentScheduleStatus,
		createdBy: number
	) {
		this.refScheduleId = refScheduleId;
		this.userId = userId;
		this.month = month;
		this.year = year;
		this.approvedAmount = 0;
		this.latePayment = 0;
		this.status = status;
		this.createdBy = createdBy;
		this.createdAt = new Date();
		this.updatedBy = createdBy;
		this.updatedAt = new Date();
	}

	updateStatus(status: UserPaymentScheduleStatus) {
		this.status = status;
		this.updatedAt = new Date();
	}

	updateApprovedAmount(approvedAmount: number) {
		this.approvedAmount = approvedAmount;
		this.updatedAt = new Date();
	}

	updateLatePaymentAmount(latePayment: number) {
		this.latePayment = latePayment;
		this.updatedAt = new Date();
	}
}
