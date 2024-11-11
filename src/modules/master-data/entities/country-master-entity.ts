import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "sb_gen_country_master" })
export class CountryMasterEntity {
	@PrimaryGeneratedColumn()
	id?: number;

	@Column()
	countryCode!: string;

	@Column()
	name!: string;

	@Column()
	status!: string;

	@Column()
	isdCodes?: string;

	@Column({ type: "blob", nullable: true })
	flag: Buffer;
}
