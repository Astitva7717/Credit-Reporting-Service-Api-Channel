import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { RefdocMaster, RefdocMasterStatusEnum } from "./refdoc-master.entity";

@Entity({ name: "sb_crs_refdocs_history" })
export class RefdocHistory {
	@PrimaryGeneratedColumn()
	historyId: number;

	@Column()
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
	suffixName: string | null;

	@Column({ type: "varchar", length: 100, nullable: true })
	ownerName: string | null;

	@Column({ type: "varchar", length: 100, nullable: true })
	propertyName: string | null;

	@Column({ type: "varchar", length: 500, nullable: true })
	addressOne: string | null;

	@Column({ type: "varchar", length: 500, nullable: true })
	addressTwo: string | null;

	@Column({ length: 50, nullable: true })
	city: string;

	@Column({ length: 50, nullable: true })
	state: string;

	@Column({ length: 20, nullable: true })
	zip: string;

	@Column({ nullable: true })
	rejectedReason: number;

	@Column({ type: "tinyint", nullable: true })
	rejectionCount: number | null;

	@Column({ nullable: true })
	remark: string;

	@Column({ type: "tinyint", nullable: true })
	rentDueDay: number | null;

	@Column({ type: "tinyint", nullable: true })
	rentPaymentDueDay: number | null;

	@CreateDateColumn({ nullable: true })
	validFrom: Date | string;

	@CreateDateColumn({ nullable: true })
	validTo: Date | string;

	@CreateDateColumn({ nullable: true })
	rentDueDate: Date | string;

	@CreateDateColumn({ nullable: true })
	rentPaymentDueDate: Date | string;

	@Column({ nullable: true })
	rentAmount: number;

	@Column({ type: "double", nullable: true })
	baseAmount: number | null;

	@Column({ type: "datetime", nullable: true })
	uploadedDate: Date | null;

	@Column({ type: "date", nullable: true })
	approvedDate: Date | null;

	@Column({ nullable: true, type: "enum", enum: RefdocMasterStatusEnum })
	status: RefdocMasterStatusEnum;

	@Column({ nullable: true })
	verifiedBy: number;

	@CreateDateColumn({ nullable: true })
	verifiedAt: Date | string;

	@CreateDateColumn({ nullable: true })
	createdAt: Date;

	@UpdateDateColumn({ nullable: true })
	updatedAt: Date;

	constructor(refdocMaster: RefdocMaster) {
		this.refdocId = refdocMaster?.refdocId;
		this.userId = refdocMaster?.userId;
		this.refdocTypeId = refdocMaster?.refdocTypeId;
		this.documentPath = refdocMaster?.documentPath;
		this.firstName = refdocMaster?.firstName;
		this.middleName = refdocMaster?.middleName;
		this.lastName = refdocMaster?.lastName;
		this.suffixName = refdocMaster?.suffixName;
		this.ownerName = refdocMaster?.ownerName;
		this.propertyName = refdocMaster?.propertyName;
		this.addressOne = refdocMaster?.addressOne;
		this.addressTwo = refdocMaster?.addressTwo;
		this.city = refdocMaster?.city;
		this.state = refdocMaster?.state;
		this.zip = refdocMaster?.zip;
		this.rejectedReason = refdocMaster?.rejectedReason;
		this.remark = refdocMaster?.remark;
		this.rentDueDay = refdocMaster?.rentDueDay;
		this.rentPaymentDueDay = refdocMaster?.rentPaymentDueDay;
		this.validFrom = refdocMaster?.validFrom;
		this.validTo = refdocMaster?.validTo;
		this.rentDueDate = refdocMaster?.rentDueDate;
		this.rentPaymentDueDate = refdocMaster?.rentPaymentDueDate;
		this.rentAmount = refdocMaster?.rentAmount;
		this.baseAmount = refdocMaster?.baseAmount;
		this.uploadedDate = refdocMaster?.uploadedDate;
		this.approvedDate = refdocMaster?.approvedDate;
		this.status = refdocMaster?.status;
		this.verifiedBy = refdocMaster?.verifiedBy;
		this.verifiedAt = refdocMaster?.verifiedAt;
		this.rejectionCount = refdocMaster?.rejectionCount
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}
