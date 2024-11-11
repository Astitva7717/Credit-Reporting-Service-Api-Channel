import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export enum DisputeHistoryStatusEnum {
	NEW = "NEW",
	APPROVED = "APPROVED",
	REJECTED = "REJECTED"
}
@Entity({ name: "sb_crs_dispute_history" })
export class DisputeHistoryEntity {
	@PrimaryGeneratedColumn({ type: "bigint" })
	id: number;

	@Column({ type: "bigint" })
	disputeId: number;

	@Column({ length: 250 })
	comment: string;

	@Column({ length: 250 })
	docUrl: string;

	@Column({ length: 250 })
	docReceipt: string;

	@Column({ type: "enum", enum: DisputeHistoryStatusEnum })
	docStatus: DisputeHistoryStatusEnum;

	@Column({ length: 250 })
	docRejectionRemark: string;

	@Column({ type: "bigint" })
	createdBy: number;

	@CreateDateColumn()
	createdAt: Date;

	constructor(disputeId: number, comment: string, createdBy: number) {
		this.disputeId = disputeId;
		const commentData = { comment };
		this.comment = JSON.stringify(commentData);
		this.createdBy = createdBy;
		this.createdAt = new Date();
	}

	addDocUrl(docUrl: string) {
		this.docUrl = docUrl;
		this.createdAt = new Date();
	}

	addCommentDocStatus(docStatus: DisputeHistoryStatusEnum) {
		this.docStatus = docStatus;
	}

	addDocRejectionRemark(docRejectionRemark: string) {
		this.docRejectionRemark = docRejectionRemark;
	}
}
