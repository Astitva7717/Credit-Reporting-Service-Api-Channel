import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum CreditorActionEnum {
	ASSIGN = "ASSIGN",
	REJECT = "REJECT"
}

export enum StatusEnum {
	NEW = "NEW",
	IN_PROGRESS = "IN-PROGRESS",
	DONE = "DONE"
}

@Entity("sb_crs_creditor_updates_async")
export class CreditorUpdatesAsync {
	@PrimaryGeneratedColumn("increment")
	id: number;

	@Column({ type: "bigint" })
	referenceRefdocId: number;

	@Column({
		type: "enum",
		enum: CreditorActionEnum
	})
	creditorAction: CreditorActionEnum;

	@Column({
		type: "enum",
		enum: StatusEnum,
		default: StatusEnum.NEW
	})
	status: StatusEnum;

	@Column({ type: "int", default: 0 })
	retryCount: number;

	@Column()
	creditor: string;

	@CreateDateColumn({ type: "datetime" })
	createdAt: Date;

	@UpdateDateColumn({ type: "datetime", onUpdate: "CURRENT_TIMESTAMP" })
	updatedAt: Date;

	constructor(
		referenceRefdocId: number,
		creditorAction: CreditorActionEnum,
		status: StatusEnum,
		retryCount: number,
		creditor: string
	) {
		this.referenceRefdocId = referenceRefdocId;
		this.creditorAction = creditorAction;
		this.status = status;
		this.retryCount = retryCount;
		this.creditor = creditor;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}
