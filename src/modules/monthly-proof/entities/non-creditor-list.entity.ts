import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("sb_crs_non_creditor_list")
export class NonCreditorList {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "varchar", length: 100, nullable: false })
	creditor: string;

	@CreateDateColumn({ type: "datetime", nullable: false })
	createdAt: Date;

	@UpdateDateColumn({ type: "datetime", nullable: false })
	updatedAt: Date;

	constructor(creditor: string) {
		this.creditor = creditor;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}
