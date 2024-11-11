import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum Status {
	ACTIVE = "ACTIVE",
	INACTIVE = "INACTIVE"
}

@Entity({
	name: "sb_gen_currency_conversion_rate_history"
})
export class CurrencyConvertionHistory {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	from_currency_id: number;

	@Column()
	to_currency_id: number;

	@Column({ type: "decimal", precision: 20, scale: 8 })
	exchange_rate: string;

	@Column()
	exchange_charge_currency_id: number;

	@Column({ type: "decimal", precision: 20, scale: 8 })
	exchange_charge: string;

	@Column()
	exchange_date: Date;

	@Column()
	updated_date: Date;
}
