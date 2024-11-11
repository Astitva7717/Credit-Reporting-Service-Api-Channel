import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "sb_crs_status_master" })
export class StatusMasterEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "varchar", length: 50, nullable: false })
	status: string;

	@Column({ type: "varchar", length: 100, nullable: false })
	description: string;

	constructor(id: number, status: string, description: string) {
		this.id = id;
		this.status = status;
		this.description = description;
	}
}
