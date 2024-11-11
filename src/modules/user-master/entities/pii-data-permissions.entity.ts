import { YNStatusEnum } from "@utils/enums/Status";
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "sb_crs_pii_data_permissions" })
export class PiiDataPermissions {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "bigint" })
	userId: number;

	@Column({ type: "enum", enum: YNStatusEnum, default: YNStatusEnum.NO })
	ssn: YNStatusEnum;

	@Column({ type: "enum", enum: YNStatusEnum, default: YNStatusEnum.NO })
	phone: YNStatusEnum;

	@Column({ type: "enum", enum: YNStatusEnum, default: YNStatusEnum.NO })
	email: YNStatusEnum;

	@Column()
	createdDate: Date;

	@Column({ type: "bigint" })
	createdBy: number;

	@Column()
	updatedDate: Date;

	@Column({ type: "bigint" })
	updateBy: number;

	constructor(userId: number, ssn: YNStatusEnum, phone: YNStatusEnum, email: YNStatusEnum) {
		this.userId = userId;
		this.ssn = ssn;
		this.phone = phone;
		this.email = email;
		this.createdDate = new Date();
		this.updatedDate = new Date();
		this.createdBy = userId;
	}

	updateVerifingData(updateBy: number) {
		this.updateBy = updateBy;
		this.updatedDate = new Date();
	}

	updateSsnPermission(ssn: YNStatusEnum, updateBy: number) {
		this.ssn = ssn;
		this.updatedDate = new Date();
		this.updateBy = updateBy;
	}

	updatePhonePermission(phone: YNStatusEnum, updateBy: number) {
		this.phone = phone;
		this.updatedDate = new Date();
		this.updateBy = updateBy;
	}

	updateEmailPermission(email: YNStatusEnum, updateBy: number) {
		this.email = email;
		this.updatedDate = new Date();
		this.updateBy = updateBy;
	}
}
