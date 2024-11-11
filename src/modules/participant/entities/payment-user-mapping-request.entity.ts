import { RequestStatusEnum } from "@utils/enums/Status";
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "sb_crs_payment_users_mapping_request" })
export class PaymentUsersMappingRequest {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	userId: number;

	@Column({ length: 50, nullable: true })
	payeeUsername: string | null;

	@Column()
	payeeUserId: number;

	@Column({ length: 50, nullable: true })
	paymentType: string;

	@Column({ length: 255, default: "" })
	emailId: string;

	@Column({ length: 20, default: "" })
	mobile: string;

	@Column({ length: 6, default: "", nullable: true })
	verificationCode: string;

	@Column({ default: 0 })
	resendCount: number;

	@Column({ nullable: true })
	refdocId: number | null;

	@Column({ length: 10, nullable: true })
	actionType: string | null;

	@Column({
		type: "enum",
		enum: RequestStatusEnum,
		nullable: true
	})
	status: RequestStatusEnum | null;

	@Column({ type: "datetime", nullable: true })
	createdAt: Date | null;

	@Column({ type: "timestamp", nullable: true })
	updatedAt: Date | null;

	constructor(
		userId: number | null,
		paymentType: string,
		emailId: string,
		mobile: string,
		verificationCode: string,
		resendCount: number,
		refdocId: number | null
	) {
		this.userId = userId;
		this.emailId = emailId;
		this.mobile = mobile;
		this.verificationCode = verificationCode;
		this.resendCount = resendCount;
		this.refdocId = refdocId;
		this.paymentType = paymentType;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}

	addPaymentUserDetails(
		actionType: string | null,
		status: RequestStatusEnum | null,
		payeeUserId: number | null,
		payeeUsername: string | null
	) {
		this.actionType = actionType;
		this.status = status;
		this.payeeUserId = payeeUserId;
		this.payeeUsername = payeeUsername;
	}
}
