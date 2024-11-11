import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("sb_crs_lease_specific_non_creditor_list")
@Index("refdoc_id", ["refdocId"])
export class LeaseSpecificNonCreditorList {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "bigint", unsigned: true })
	refdocId: number;

	@Column({ type: "varchar", length: 100 })
	creditor: string;

	@Column({ type: "int" })
	confidenceScore: number;

	@CreateDateColumn({ type: "datetime" })
	createdAt: Date;

	@UpdateDateColumn({ type: "datetime", onUpdate: "CURRENT_TIMESTAMP" })
	updatedAt: Date;

	constructor(refdocId: number, creditor: string, confidenceScore: number) {
		this.refdocId = refdocId;
		this.creditor = creditor;
		this.confidenceScore = confidenceScore;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}
