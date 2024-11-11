import { Status } from "@utils/enums/Status";
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "sb_crs_not_signed_options" })
export class NotSignedOption {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "varchar", length: 50 })
	option: string;

	@Column({ type: "enum", enum: Status, default: Status.ACTIVE })
	status: Status;

	constructor(option: string = null, staus: Status = null){
        this.option = option
        this.status = staus
    };
}
