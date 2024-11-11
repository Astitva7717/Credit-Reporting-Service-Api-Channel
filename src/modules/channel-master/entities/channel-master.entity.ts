import { Status } from "src/modules/business-master/entities/business-master.entity";
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity({
	name: "sb_crs_channel_master"
})
export class ChannelMaster {
	@PrimaryColumn()
	channelId: number;

	@Column({ length: 255 })
	name: string;

	@Column({ length: 255 })
	channelType: string;

	@Column()
	businessId: number;

	@Column({ length: 255 })
	currencyCode: string;

	@Column({ length: 255 })
	status: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@Column({ length: 255 })
	cashier_callback_path: string;

	constructor(reqBean) {
		this.channelId = reqBean?.ucmChannelId;
		this.name = reqBean?.ucmChannelName;
		this.channelType = reqBean?.channelType;
		this.businessId = reqBean?.ucmBusinessId;
		this.currencyCode = reqBean?.currencyCode;
		this.status = Status.ACTIVE;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}
