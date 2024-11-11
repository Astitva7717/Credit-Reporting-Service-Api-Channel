import { Status } from "src/modules/business-master/entities/business-master.entity";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({
	name: "sb_crs_channel_configuration_master"
})
export class ChannelConfigurationMaster {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	channelId: number;

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

	public constructor(channelId: number, configCode: string, configValue: string, status: Status) {
		this.channelId = channelId;
		this.configCode = configCode;
		this.configValue = configValue;
		this.status = status;
		this.updatedAt = new Date();
		this.createdAt = new Date();
	}

	public update(configValue: string, status: Status) {
		this.configValue = configValue;
		this.status = status;
		this.updatedAt = new Date();
		return this;
	}
}
