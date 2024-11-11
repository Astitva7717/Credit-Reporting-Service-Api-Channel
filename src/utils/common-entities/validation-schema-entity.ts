import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
@Entity("sb_crs_validation_schema")
export class ValidationBean {
	@PrimaryGeneratedColumn()
	id: number;
	@Column()
	serviceName: string;
	@Column()
	requiredSchema: string;
}
