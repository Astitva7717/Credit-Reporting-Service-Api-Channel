import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("sb_crs_college_master")
export class CollegeMasterEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	ipedsId: string;

	@Column()
	name: string;

	@Column()
	address: string;

	@Column()
	city: string;

	@Column()
	state: string;

	@Column()
	zip: string;

	@Column()
	county: string;

	@Column()
	country: string;

	@CreateDateColumn({ type: "timestamp" })
	createdAt: Date;

	@UpdateDateColumn({ type: "timestamp" })
	updatedAt: Date;

	constructor(
		ipedsId: string,
		name: string,
		address: string,
		city: string,
		state: string,
		zip: string,
		county: string,
		country: string,
		createdAt: Date,
		updatedAt: Date
	) {
		this.ipedsId = ipedsId;
		this.name = name;
		this.address = address;
		this.city = city;
		this.state = state;
		this.zip = zip;
		this.county = county;
		this.country = country;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}
}
