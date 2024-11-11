import { Status } from "src/utils/enums/Status";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "sb_gen_city_master" })
export class CityMasterEntity {
	@PrimaryGeneratedColumn()
	cityId?: number;

	@Column()
	cityCode?: string;

	@Column()
	cityName?: string;

	@Column()
	stateCode?: string;

	@Column()
	countryCode?: string;

	@Column()
	status!: Status;
}
