import { RequestStatusEnum } from "@utils/enums/Status";
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "sb_crs_participant_map_requests" })
export class ParticipantMapRequest {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: true })
	userId: number | null;

	@Column({ nullable: true })
	participantUserId: number | null;

	@Column({ length: 50, nullable: true })
	name: string | null;

	@Column({ length: 255, default: "" })
	emailId: string;

	@Column({ length: 20, default: "" })
	mobile: string;

	@Column({ nullable: true })
	rejectionReasonId: number | null;

	@Column({ length: 6, default: "" })
	verificationCode: string;

	@Column({ default: 0 })
	resendCount: number;

	@Column({ length: 50, default: "" })
	paymentBy: string;

	@Column({ nullable: true })
	refdocId: number | null;

	@Column({ nullable: true })
	packageId: number | null;

	@Column({ nullable: true })
	actionType: string | null;

	@Column({ nullable: true, enum: RequestStatusEnum })
	status: RequestStatusEnum | null;

	@CreateDateColumn({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
	createdAt: Date;

	@UpdateDateColumn({ type: "timestamp", onUpdate: "CURRENT_TIMESTAMP", nullable: true })
	updatedAt: Date | null;

	constructor(
		userId: number | null,
		participantUserId: number | null,
		name: string | null,
		emailId: string,
		mobile: string,
		verificationCode: string,
		resendCount: number
	) {
		this.userId = userId;
		this.participantUserId = participantUserId;
		this.name = name;
		this.emailId = emailId;
		this.mobile = mobile;
		this.verificationCode = verificationCode;
		this.resendCount = resendCount;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}

	setRejectionReasonId(id: number) {
		this.rejectionReasonId = id;
	}

	addParticiapntDetails(
		paymentBy: string,
		refdocId: number | null,
		packageId: number | null,
		actionType: string | null,
		status: RequestStatusEnum | null
	) {
		this.paymentBy = paymentBy;
		this.refdocId = refdocId;
		this.packageId = packageId;
		this.actionType = actionType;
		this.status = status;
	}
}
