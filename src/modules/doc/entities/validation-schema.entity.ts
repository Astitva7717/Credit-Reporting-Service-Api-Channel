import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({
	name: "sb_crs_validation_schema"
})
export class ValidationSchema {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: true })
	requiredSchema: string;

	@Column({ length: 255, nullable: true })
	serviceName: string;

	constructor(requiredSchema: string = null, serviceName: string = null) {
		this.requiredSchema = requiredSchema;
		this.serviceName = serviceName;
	}
}
