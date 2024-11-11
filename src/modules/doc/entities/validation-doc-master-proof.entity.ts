import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum MasterProofTypeEnum {
	"PLAID" = "PLAID",
	"AGREEMENT" = "AGREEMENT",
	"MONTHLY_REQUIRED" = "MONTHLY_REQUIRED",
	"DESCRIPTION" = "DESCRIPTION"
}

export enum ProofStatus {
	"ACTIVE" = "ACTIVE",
	"INACTIVE" = "INACTIVE",
	"TERMINATED" = "TERMINATED",
	"REJECTED" = "REJECTED",
	"EXPIRED" = "EXPIRED",
	"REQUESTED" = "REQUESTED",
	"APPROVED" = "APPROVED",
	"LEASE_PENDING" = "LEASE_PENDING",
	"MASTER_PROOF_VERIFICATION_PENDING" = "MASTER_PROOF_VERIFICATION_PENDING",
	"REFDOC_UPLOAD_PENDING" = "REFDOC_UPLOAD_PENDING",
	"PLAID_ISSUE" = "PLAID_ISSUE"
}

@Entity({
	name: "sb_crs_validation_doc_master_proof"
})
export class ValidationDocMasterProof {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	userId: number;

	@Column()
	payeeId: number;

	@Column()
	refdocId: number;

	@Column()
	plaidTokenId: number;

	@Column({ length: 50, nullable: true })
	paymentType: string;

	@Column({ length: 50, nullable: true })
	masterProofType: MasterProofTypeEnum;

	@Column({ length: 100, nullable: true })
	proofIdValue: string;

	@Column({ nullable: true })
	proofPath: string;

	@Column({ nullable: true })
	proofDetail: string;

	@Column({ type: "tinyint", nullable: true })
	rejectedReason: number | null;

	@Column({ type: "text", nullable: true })
	remark: string | null;

	@CreateDateColumn({ nullable: true })
	validTill: Date | string;

	@Column({ nullable: true, type: "enum", enum: ProofStatus })
	status: ProofStatus;

	@Column({ nullable: true })
	verifiedBy: number;

	@CreateDateColumn({ nullable: true })
	verifiedAt: Date | string;

	@CreateDateColumn({ nullable: true })
	fetchFrom: Date;

	@CreateDateColumn({ nullable: true })
	firstFetchFrom: Date;

	@CreateDateColumn({ nullable: true })
	createdAt: Date;

	@UpdateDateColumn({ nullable: true })
	updatedAt: Date;

	constructor(
		userId: number,
		payeeId: number,
		refdocId: number,
		masterProofType: MasterProofTypeEnum,
		paymentType: string,
		status: ProofStatus
	) {
		this.userId = userId;
		this.payeeId = payeeId;
		this.refdocId = refdocId;
		this.masterProofType = masterProofType;
		this.paymentType = paymentType;
		this.status = status;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}

	updatePlaidTokenId(plaidTokenId: number) {
		this.plaidTokenId = plaidTokenId;
	}

	updateProofDetails(proofIdValue: string, proofPath: string, proofDetail: string) {
		this.proofIdValue = proofIdValue;
		this.proofPath = proofPath;
		this.proofDetail = proofDetail;
	}

	updateValidTill(validTill: Date) {
		this.validTill = validTill;
	}

	updateVerifingDetails(verifiedBy: number) {
		this.verifiedBy = verifiedBy;
		this.verifiedAt = new Date();
	}

	updateUpdatedAtDate() {
		this.updatedAt = new Date();
	}

	updateRemarkRejectionReason(remark: string, rejectedReasonId: number) {
		this.remark = remark;
		this.rejectedReason = rejectedReasonId;
		this.updatedAt = new Date();
	}

	updateStatus(status: ProofStatus) {
		this.status = status;
		this.updatedAt = new Date();
	}
}
