import { RentPaymentByEnum, Status } from "@utils/enums/Status";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum isPrimary {
	"Y" = "Y",
	"N" = "N"
}

@Entity({
	name: "sb_crs_refdoc_participants"
})
export class RefdocParticipantsMaster {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: true })
	userId: number;

	@Column({ type: "enum", enum: isPrimary })
	isPrimary: isPrimary;

	@Column()
	refdocId: number;

	@Column({ nullable: true, type: "enum", enum: isPrimary })
	cbReportingAllowed: isPrimary;

	@Column({ type: "text", nullable: true })
	paymentSchedule: string;

	@Column({ type:"enum", enum:RentPaymentByEnum })
	paymentBy: RentPaymentByEnum;

	@Column({ nullable: true })
	packageId: number;

	@Column({ nullable: true, type: "enum", enum: Status })
	status: Status;

	@CreateDateColumn({ nullable: true })
	createdAt: Date;

	@UpdateDateColumn({ nullable: true })
	updatedAt: Date;

	constructor(
		userId: number,
		isPrimary: isPrimary,
		refdocId: number,
		cbReportingAllowed: isPrimary,
		paymentBy: RentPaymentByEnum,
		packageId: number = null,
		status: Status = null,
	) {
		this.userId = userId;
		this.isPrimary = isPrimary;
		this.refdocId = refdocId;
		this.cbReportingAllowed = cbReportingAllowed;
		this.paymentBy = paymentBy;
		this.packageId = packageId;
		this.status = status;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}
