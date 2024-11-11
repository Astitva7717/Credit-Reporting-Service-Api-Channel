import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "sb_gen_state_master" })
export class StateMasterEntity {
	@PrimaryGeneratedColumn()
	id?: number;

	@Column()
	stateCode!: string;

	@Column()
	countryCode!: string;

	@Column()
	name!: string;

	@Column()
	status!: string;
}
