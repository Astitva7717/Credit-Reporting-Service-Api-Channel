import { Status } from "@utils/enums/Status";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("sb_crs_refdoc_users")
export class RefdocUsersEntity {
	@PrimaryGeneratedColumn({ type: "bigint" })
	id!: number;

	@Column({ type: "bigint", name: "refdoc_id" })
	refdocId!: number;

	@Column({ type: "bigint", nullable: true })
	tenantId?: number;

	@Column({ type: "bigint", name: "paydoc_user_id", nullable: true })
	paydocUserId?: number;

	@Column({ type: "bigint", name: "veridoc_user_id", nullable: true })
	veridocUserId?: number;

	@Column({ type: "enum", enum: Status, nullable: true })
	status?: Status;

	@CreateDateColumn({ name: "created_at", type: "datetime" })
	createdAt!: Date;

	@UpdateDateColumn({ name: "updated_at", type: "datetime" })
	updatedAt!: Date;

	constructor(
		refdocId: number,
		tenantId: number = null,
		paydocUserId: number = null,
		veridocUserId: number = null,
		status: Status = null
	) {
		this.refdocId = refdocId;
		this.tenantId = tenantId;
		this.paydocUserId = paydocUserId;
		this.veridocUserId = veridocUserId;
		this.status = status;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}

	updateStatus(status: Status){
		this.status = status
		this.updatedAt = new Date()
	}
}
