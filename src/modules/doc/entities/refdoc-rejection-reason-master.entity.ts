import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Status } from "@utils/enums/Status";

@Entity({
	name: "sb_crs_refdoc_rejection_reason_master"
})
export class RefdocRejectionReasonMaster {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ length: 255, nullable: true })
	reason: string;

	@Column({ type: "enum", enum: Status, default: Status.ACTIVE, nullable: true })
	status: Status;

	@CreateDateColumn({ nullable: true })
	createdAt: Date;

	@UpdateDateColumn({ nullable: true })
	updatedAt: Date;

	constructor(
		reason: string = null,
		status: Status = null
	) {
		this.reason = reason;
		this.status = status;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}
