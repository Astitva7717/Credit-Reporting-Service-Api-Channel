import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { BusinessRegistrationRequest } from "../dto/create-business-master.dto";

export enum Status {
	"ACTIVE" = "ACTIVE",
	"INACTIVE" = "INACTIVE",
	"BLOCKED" = "BLOCKED",
	"TERMINATED" = "TERMINATED",
	"TERMINATE" = "TERMINATE"
}

export interface SbNFTBusinessMasterAttributes {
	businessId: number;
	businessCode?: string;
	businessName?: string;
	contactPerson?: string;
	mobileNumber?: string;
	mobileCode?: string;
	phoneNumber?: string;
	phoneCode?: string;
	emailId?: string;
	addressOne?: string;
	addressTwo?: string;
	zipCode?: string;
	city?: string;
	state?: string;
	country?: string;
	cityCode?: string;
	stateCode?: string;
	countryCode?: string;
	status: Status;
	blockDate?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}
@Entity({
	name: "sb_crs_business_master"
})
export class BusinessMaster {
	@PrimaryColumn()
	businessId: number;

	@Column({ length: 255, unique: true })
	businessCode: string;

	@Column({ length: 255 })
	businessName: string;

	@Column({ length: 255 })
	contactPerson: string;

	@Column({ length: 255, unique: true })
	mobileNumber: string;

	@Column({ length: 255 })
	mobileCode: string;

	@Column({ length: 255 })
	phoneNumber: string;

	@Column({ length: 255 })
	phoneCode: string;

	@Column({ length: 255, unique: true })
	emailId: string;

	@Column({ length: 255 })
	addressOne: string;

	@Column({ length: 255 })
	addressTwo: string;

	@Column({ length: 255 })
	zipCode: string;

	@Column({ length: 255 })
	city: string;

	@Column({ length: 255 })
	state: string;

	@Column({ length: 255 })
	country: string;

	@Column({ length: 255 })
	cityCode: string;

	@Column({ length: 255 })
	countryCode: string;

	@Column({ length: 255 })
	stateCode: string;

	@Column({
		type: "enum",
		enum: Status,
		default: Status.ACTIVE
	})
	status: string;

	@Column({ nullable: true })
	blockDate: Date;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	constructor(businessRequest: BusinessRegistrationRequest) {
		this.businessId = businessRequest?.ucmBusinessId;
		this.businessCode = businessRequest?.businessCode;
		this.businessName = businessRequest?.businessName;
		this.contactPerson = businessRequest?.contactPerson;
		this.mobileNumber = businessRequest?.mobileNumber;
		this.mobileCode = businessRequest?.mobileCode;
		this.phoneNumber = businessRequest?.phoneNumber;
		this.phoneCode = businessRequest?.phoneCode;
		this.emailId = businessRequest?.emailId;
		this.addressOne = businessRequest?.addressOne;
		this.addressTwo = businessRequest?.addressTwo;
		this.zipCode = businessRequest?.zipCode;
		this.city = businessRequest?.city;
		this.state = businessRequest?.state;
		this.country = businessRequest?.country;
		this.cityCode = businessRequest?.cityCode;
		this.stateCode = businessRequest?.stateCode;
		this.countryCode = businessRequest?.countryCode;
		this.status = Status.ACTIVE;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}
