import { Status } from "src/modules/business-master/entities/business-configuration-master-entity";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { AliasRequestBean } from "../dto/alias-request.dto";

@Entity({ name: "sb_crs_alias_master" })
export class AliasMaster {
	@PrimaryGeneratedColumn()
	aliasId?: number;

	@Column()
	channelId!: number;

	@Column()
	name!: string;

	@Column()
	status!: Status;

	@Column()
	createdAt?: Date;

	@Column()
	updatedAt?: Date;

	@Column({ nullable: true })
	allowedIps?: string;

	constructor(createAliasRequest: AliasRequestBean) {
		this.aliasId = createAliasRequest?.ucmAliasId;
		this.channelId = createAliasRequest?.ucmChannelId;
		this.name = createAliasRequest?.ucmAliasName;
		this.status = Status.ACTIVE;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}
