import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum DisputeTypeStatusEnum {
	ACTIVE = "ACTIVE",
	INACTIVE = "INACTIVE"
}

@Entity({ name: "sb_crs_dispute_type_master" })
export class DisputeTypeMaster {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "varchar", length: 50 })
	type: string;

	@Column({ type: "enum", enum: DisputeTypeStatusEnum })
	status: DisputeTypeStatusEnum;

	@Column()
	createdAt: Date;

	constructor(type: string) {
		this.status = DisputeTypeStatusEnum.ACTIVE;
		this.type = type;
		this.createdAt = new Date();
	}
}
