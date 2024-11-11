import { DisplayYesNoEnum, YNStatusEnum } from "@utils/enums/Status";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum RefdocMasterStatusEnum {
	ACTIVE = "ACTIVE",
	INACTIVE = "INACTIVE",
	TERMINATED = "TERMINATED",
	REJECTED = "REJECTED",
	EXPIRED = "EXPIRED",
	REQUESTED = "REQUESTED",
	APPROVED = "APPROVED",
	LEASE_PENDING = "LEASE_PENDING",
	MASTER_PROOF_VERIFICATION_PENDING = "MASTER_PROOF_VERIFICATION_PENDING",
	REFDOC_UPLOAD_PENDING = "REFDOC_UPLOAD_PENDING",
	TENANT_DETAILS_PENDING = "TENANT_DETAILS_PENDING",
	PROPOSED_TO_APPROVE = "PROPOSED_TO_APPROVE",
	PROPOSED_TO_REJECT = "PROPOSED_TO_REJECT",
	REUPLOADED = "REUPLOADED",
	NEWLY_UPLOADED = "NEWLY_UPLOADED",
	INTERMEDIATE_REJECTION = "INTERMEDIATE_REJECTION"
}

export enum BuisnessTypeEnum {
	B2B = "B2B",
	B2C = "B2C"
}
@Entity({
	name: "sb_crs_refdocs"
})
export class RefdocMaster {
	@PrimaryGeneratedColumn()
	refdocId: number;

	@Column()
	userId: number;

	@Column({ nullable: true })
	refdocTypeId: number;

	@Column({ length: 255, nullable: true })
	documentPath: string;

	@Column({ type: "varchar", length: 100, nullable: true })
	firstName: string | null;

	@Column({ type: "varchar", length: 100, nullable: true })
	middleName: string | null;

	@Column({ type: "varchar", length: 100, nullable: true })
	lastName: string | null;

	@Column({ type: "varchar", length: 100, nullable: true })
	ownerName: string | null;

	@Column({ type: "varchar", length: 100, nullable: true })
	suffixName: string | null;

	@Column({ type: "varchar", length: 100, nullable: true })
	propertyName: string | null;

	@Column({ type: "varchar", length: 500, nullable: true })
	addressOne: string | null;

	@Column({ type: "varchar", length: 500, nullable: true })
	addressTwo: string | null;

	@Column({ type: "varchar", length: 50, nullable: true })
	city: string | null;

	@Column({ type: "varchar", length: 50, nullable: true })
	state: string | null;

	@Column({ type: "varchar", length: 20, nullable: true })
	zip: string | null;

	@Column({ type: "tinyint", nullable: true })
	rejectedReason: number | null;

	@Column({ type: "tinyint", nullable: true })
	rejectionCount: number | null;

	@Column({ type: "text", nullable: true })
	remark: string | null;

	@Column({ type: "text", nullable: true })
	rentDueDay: number | null;

	@Column({ type: "text", nullable: true })
	rentPaymentDueDay: number | null;

	@Column({ type: "date", nullable: true })
	validFrom: Date | null;

	@Column({ type: "date", nullable: true })
	rentDueDate: Date | null;

	@Column({ type: "date", nullable: true })
	rentPaymentDueDate: Date | null;

	@Column({ type: "date", nullable: true })
	validTo: Date | null;

	@Column({ type: "datetime", nullable: true })
	uploadedDate: Date | null;

	@Column({ type: "date", nullable: true })
	approvedDate: Date | null;

	@Column({ type: "double", nullable: true })
	rentAmount: number | null;

	@Column({ type: "double", nullable: true })
	baseAmount: number | null;

	@Column({ type: "enum", enum: RefdocMasterStatusEnum, nullable: true })
	status: RefdocMasterStatusEnum;

	@Column({ nullable: true })
	verifiedBy: number;

	@CreateDateColumn({ nullable: true })
	verifiedAt: Date;

	@CreateDateColumn({ nullable: true })
	createdAt: Date;

	@UpdateDateColumn({ nullable: true })
	updatedAt: Date;

	@Column({ type: "text" })
	interimData: string;

	@Column({ length: 10, nullable: true })
	displayRefdocId: string;

	@Column({ type: "enum", enum: YNStatusEnum })
	documentPresent: YNStatusEnum;

	@Column({ type: "enum", enum: BuisnessTypeEnum })
	buisnessType: BuisnessTypeEnum;

	@Column({ type: "enum", enum: DisplayYesNoEnum })
	variableComponentLease: DisplayYesNoEnum;

	@Column({ type: "varchar", length: 250, nullable: true })
	creditors: string | null;

	constructor(
		userId: number,
		refdocTypeId: number = null,
		documentPath: string = null,
		addressOne: string = null,
		addressTwo: string = null,
		status: RefdocMasterStatusEnum = null,
		baseAmount: number = null
	) {
		this.userId = userId;
		this.refdocTypeId = refdocTypeId;
		this.documentPath = documentPath;
		this.addressOne = addressOne;
		this.addressTwo = addressTwo;
		this.status = status;
		this.createdAt = new Date();
		this.updatedAt = new Date();
		this.baseAmount = baseAmount;
	}

	updateAddressDetails(city: string, state: string, zip: string) {
		this.city = city;
		this.state = state;
		this.zip = zip;
		this.updatedAt = new Date();
	}

	updateRefdocDetails(
		validFrom: Date = null,
		validTo: Date = null,
		rentAmount: number = null,
		rejectedReason: number = null,
		rentDueDay: number = null,
		rentPaymentDueDay: number = null
	) {
		this.validFrom = validFrom;
		this.validTo = validTo;
		this.rentAmount = rentAmount;
		this.rejectedReason = rejectedReason;
		this.updatedAt = new Date();
		this.rentDueDay = rentDueDay;
		this.rentPaymentDueDay = rentPaymentDueDay;
	}

	updateVerifingUserDetail(verifiedBy: number, verifiedAt: Date) {
		this.verifiedBy = verifiedBy;
		this.verifiedAt = verifiedAt;
		this.updatedAt = new Date();
	}

	updateRefdocRemark(remark: string) {
		this.remark = remark;
		this.updatedAt = new Date();
	}

	updateRefdocStatus(status: RefdocMasterStatusEnum) {
		this.status = status;
		this.updatedAt = new Date();
	}

	updateDocumentPath(documentPath: string) {
		this.documentPath = documentPath;
		this.updatedAt = new Date();
	}

	updateUploadAndApproveDetails(uploadedDate: Date = null, approvedDate: Date = null) {
		this.uploadedDate = uploadedDate;
		this.approvedDate = approvedDate;
		this.updatedAt = new Date();
	}

	updateInterimData(interimData: string) {
		this.interimData = interimData;
		this.updatedAt = new Date();
	}

	updateCustomerDetails(
		firstName: string,
		middleName: string,
		lastName: string,
		ownerName: string,
		suffixName: string,
		propertyName: string
	) {
		this.firstName = firstName;
		this.middleName = middleName;
		this.lastName = lastName;
		this.ownerName = ownerName;
		this.suffixName = suffixName;
		this.propertyName = propertyName;
	}
}
