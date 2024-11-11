import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum Status {
	"ACTIVE" = "ACTIVE",
	"BLOCKED" = "BLOCKED",
	"TERMINATED" = "TERMINATED",
	"TERMINATE" = "TERMINATE",
	"INACTIVE" = "INACTIVE"
}

@Entity({
	name: "sb_crs_business_configuration_master"
})
export class BusinessConfigurationMaster {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	businessId: number;

	@Column({ length: 255 })
	configCode: string;

	@Column({ length: 255 })
	configValue: string;

	@Column()
	status: Status;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	constructor(businessId: number, configCode: string, configValue: string, status: Status) {
		this.businessId = businessId;
		this.configCode = configCode;
		this.configValue = configValue;
		this.status = status;
	}

	public update(configValue: string, status: Status) {
		this.configValue = configValue;
		this.status = status;
	}
}
