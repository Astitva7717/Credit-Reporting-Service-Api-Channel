import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum PaymentScheduleStatus {
	NEW = "NEW",
	DUE = "DUE",
	UPLOADED = "UPLOADED",
	PARTIALLY_UPLOADED = "PARTIALLY_UPLOADED",
	DISPUTE_RAISED = "DISPUTE_RAISED",
	REPORTED = "REPORTED",
	INACTIVE = "INACTIVE",
	AMOUNT_DUE = "AMOUNT_DUE",
	READY_FOR_REPORTING = "READY_FOR_REPORTING",
	REPORTING_INITIATED = "REPORTING_INITIATED",
	SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED",
	SUBSCRIPTION_PENDING = "SUBSCRIPTION_PENDING",
	LATE_PAYMENT = "LATE_PAYMENT"
}

@Entity({ name: "sb_crs_payment_schedule" })
export class PaymentSchedule {
	@PrimaryGeneratedColumn({ type: "bigint" })
	id: number;

	@Column({ type: "bigint", name: "refdoc_id" })
	leaseId: number;

	@Column({ length: 3 })
	month: string;

	@Column({ type: "double", precision: 10, scale: 0 })
	year: number;

	@Column({ type: "date" })
	dueDate: Date;

	@Column({ type: "date", nullable: true })
	paymentDueDate: Date;

	@Column({ type: "double", precision: 10, scale: 2 })
	amount: number;

	@Column({ type: "double", precision: 10, scale: 2 })
	modifiedAmount: number;

	@Column({ type: "text" })
	notes: string;

	@Column({ type: "double", precision: 10, scale: 2 })
	approvedAmount: number;

	@Column({ type: "double", precision: 10, scale: 2 })
	latePayment: number;

	@Column({
		type: "enum",
		enum: PaymentScheduleStatus,
		default: PaymentScheduleStatus.NEW
	})
	status: PaymentScheduleStatus;

	@CreateDateColumn({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
	createdAt: Date;

	@Column({ type: "bigint" })
	createdBy: number;

	@UpdateDateColumn({ type: "datetime", default: null, onUpdate: "CURRENT_TIMESTAMP" })
	updatedAt: Date;

	@Column({ type: "bigint" })
	updatedBy: number;

	constructor(
		leaseId: number,
		dueDate: Date = null,
		paymentDueDate: Date = null,
		amount: number = null,
		status: PaymentScheduleStatus = null
	) {
		this.leaseId = leaseId;
		this.dueDate = dueDate;
		this.paymentDueDate = paymentDueDate;
		this.amount = amount;
		this.status = status;
		this.createdAt = new Date();
		this.updatedAt = new Date();
		this.approvedAmount = 0;
		this.latePayment = 0;
	}

	updateMonthAndYear(month: string, year: number) {
		this.month = month;
		this.year = year;
	}

	updateCreatedBy(createdBy: number) {
		this.createdBy = createdBy;
		this.updatedAt = new Date();
	}

	updateUpdatedBy(updatedBy: number) {
		this.updatedBy = updatedBy;
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

	updateStatus(status: PaymentScheduleStatus) {
		this.status = status;
		this.updatedAt = new Date();
	}

	updateModifiedAmount(modifiedAmount: number) {
		this.modifiedAmount = modifiedAmount;
		this.updatedAt = new Date();
	}

	updateNotes(notes: string) {
		this.notes = notes;
		this.updatedAt = new Date();
	}
}
