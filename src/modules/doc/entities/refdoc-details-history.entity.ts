import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "sb_crs_refdoc_details_history" })
export class RefdocDetailsHistoryEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ name: "history_id" })
	historyId: number;

	@Column({ length: 250 })
	key: string;

	@Column({ length: 250 })
	value: string;

	@CreateDateColumn({ name: "created_at" })
	createdAt: Date;

	@UpdateDateColumn({ name: "update_at", nullable: true })
	updatedAt: Date;

	constructor(historyId: number, key: string, value: string) {
		this.historyId = historyId;
		this.key = key;
		this.value = value;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}
