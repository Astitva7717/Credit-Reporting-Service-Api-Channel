import { Status } from "src/modules/business-master/entities/business-master.entity";
import { ConfigTypes } from "src/utils/enums/config-type";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ConfigCodes } from "../dto/config-codes";

@Entity({
	name: "sb_crs_configuration_master"
})
export class ConfigurationMaster {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ length: 255 })
	configCode: string;

	@Column({ type: "text" })
	configValue: string;

	@Column()
	configType: ConfigTypes;

	@Column()
	status: Status;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	constructor(configCodes: ConfigCodes) {
		this.configCode = configCodes?.configCode;
		this.configValue = configCodes?.configValue;
		this.configType = ConfigTypes[configCodes?.configType];
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}
