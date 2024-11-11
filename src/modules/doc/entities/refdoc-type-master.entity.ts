import { Status } from "@utils/enums/Status";
import { DocumentTypeEnum } from "@utils/enums/constants";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({
	name: "sb_crs_refdoc_type_master"
})
export class RefdocTypeMaster {
	@PrimaryGeneratedColumn()
	refdocTypeId: number;

	@Column({ length: 100 })
	name: string;

	@Column({ nullable: true })
	logo: string;

	@Column({ nullable: true })
	serviceCode: string;

	@Column({ type: "enum", enum: Status, nullable: true })
	status: Status;

	@Column({ type: "enum", enum: DocumentTypeEnum })
	documentType: DocumentTypeEnum;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn({ nullable: true })
	updatedAt: Date;

	constructor(
		name: string,
		logo: string = null,
		serviceCode: string = null,
		status: Status = null,
	) {
		this.name = name;
		this.logo = logo;
		this.serviceCode = serviceCode;
		this.status = status;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}
