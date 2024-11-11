import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { DecimalAllowed } from "../dto/create-currency-master.dto";
import { ExchangeType } from "../dto/currency-conversion-rate.dto";

export enum Status {
	ACTIVE = "ACTIVE",
	INACTIVE = "INACTIVE"
}

@Entity({
	name: "sb_gen_currency_conversion_rate"
})
export class CurrencyConvertorRateMaster {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "enum", enum: DecimalAllowed, default: DecimalAllowed.YES })
	exchangeType: ExchangeType;

	@Column()
	fromCurrencyId: number;

	@Column()
	toCurrencyId: number;

	@Column({ type: "decimal", precision: 20, scale: 8 })
	exchangeRateFrom: number;

	@Column()
	exchangeChargeCurrencyId: number;

	@Column({ type: "decimal", precision: 20, scale: 8 })
	exchangeCharge: number;

	@Column()
	exchangeDate: Date;

	@Column({ type: "enum", enum: Status, default: Status.ACTIVE })
	status: Status;

	@Column()
	updatedAt: Date;
}
