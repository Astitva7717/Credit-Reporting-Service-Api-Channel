import { Status, YNStatusEnum } from "src/utils/enums/Status";
import { UserType } from "src/utils/enums/user-types";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "sb_crs_user_info" })
export class UserMasterEntity {
	@PrimaryGeneratedColumn()
	userId?: number;

	@Column()
	businessId!: number;

	@Column()
	channelId!: number;

	@Column()
	aliasId!: number;

	@Column()
	systemUserId!: string;

	@Column()
	userType!: UserType;

	@Column()
	mobileCode?: string;

	@Column()
	mobileNo?: string;

	@Column()
	username!: string;

	@Column()
	emailId?: string;

	@Column()
	firstName?: string;

	@Column()
	middleName?: string;

	@Column()
	lastName?: string;

	@Column()
	suffixName?: string;

	@Column()
	vipLevelId?: number;

	@Column()
	addressOne?: string;

	@Column()
	addressTwo?: string;

	@Column()
	cityCode?: string;

	@Column()
	city?: string;

	@Column()
	stateCode?: string;

	@Column()
	state?: string;

	@Column()
	countryCode?: string;

	@Column()
	country?: string;

	@Column()
	zip?: string;

	@Column()
	currencyCode?: string;

	@Column({ length: 50, nullable: true })
	primaryIdValue: string;

	@Column({ length: 50, nullable: true })
	ssn: string;

	@Column({ nullable: true })
	ssnVerified: YNStatusEnum;

	@Column({ nullable: true })
	refDocParticipant: YNStatusEnum;

	@Column({ nullable: true })
	payDocParticipant: YNStatusEnum;

	@Column({ nullable: true })
	veriDocParticipant: YNStatusEnum;

	@Column()
	status?: Status;

	@Column({ type: "date", nullable: true })
	dateOfBirth: Date | string;

	@Column()
	emailVerified?: YNStatusEnum;

	@Column()
	mobileVerified?: YNStatusEnum;

	@CreateDateColumn()
	createdAt?: Date | string;

	@UpdateDateColumn()
	updatedAt?: Date;
}
