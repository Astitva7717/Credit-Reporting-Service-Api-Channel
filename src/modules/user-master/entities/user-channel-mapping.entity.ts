import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "sb_crs_user_channel_mapping" })
export class UserChannelMapping {
	@PrimaryGeneratedColumn()
	id?: number;

	@Column()
	userId!: number;

	@Column()
	channelId!: number;

	@Column()
	status?: number;

	@Column()
	createdAt?: Date;

	@Column()
	updatedAt?: Date;

	constructor(userId: number, channelId: number, status: number) {
		this.userId = userId;
		this.channelId = channelId;
		this.status = status;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}
