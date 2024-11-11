import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum ReportinStatus {
	"GENERATED" = "GENERATED",
	"SETTLED" = "SETTLED",
	"IN_REVIEW" = "IN_REVIEW"
}

@Entity({
	name: "sb_crs_user_credit_reporting_disputes"
})
export class UserCreditReportingDisputes {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	userId: number;

	@Column()
	requestId: number;

	@Column({ length: 50, nullable: true })
	paymentType: string;

	@Column()
	refdocId: number;

	@Column()
	masterProofType: number;

	@Column({ nullable: true })
	monthlyProofDetails: string;

	@Column({ length: 50, nullable: true })
	disputeType: string;

	@Column({ nullable: true, type: "enum", enum: ReportinStatus })
	status: ReportinStatus;

	@Column({ nullable: true })
	actionRequired: string;

	@Column()
	verifiedBy: number;

	@CreateDateColumn({ nullable: true })
	verifiedAt: Date;

	@CreateDateColumn({ nullable: true })
	createdAt: Date;

	@UpdateDateColumn({ nullable: true })
	updatedAt: Date;

	constructor(
		userId: number,
		requestId: number,
		paymentType: string,
		refdocId: number,
		masterProofType: number,
		monthlyProofDetails: string,
		disputeType: string
	) {
		this.userId = userId;
		this.requestId = requestId;
		this.paymentType = paymentType;
		this.refdocId = refdocId;
		this.masterProofType = masterProofType;
		this.monthlyProofDetails = monthlyProofDetails;
		this.disputeType = disputeType;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}

	addDetails(verifiedBy: number, verifiedAt: Date = null, status: ReportinStatus = null, actionRequired: string = null) {
		this.verifiedBy = verifiedBy;
		this.verifiedAt = verifiedAt;
		this.status = status;
		this.actionRequired = actionRequired;
	}
}
