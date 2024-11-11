import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { DecimalAllowed } from "../dto/create-currency-master.dto";

@Entity({
	name: "sb_gen_currency_master"
})
export class CurrencyConvertorMaster {
	@PrimaryGeneratedColumn()
	currencyId: number;

	@Column({ length: 3 })
	currencyCode: string;

	@Column({ length: 100 })
	currencyDescription: string;

	@Column({ length: 5 })
	countryCode: string;

	@Column({ type: "enum", enum: DecimalAllowed, default: DecimalAllowed.YES })
	decimalAllowed: DecimalAllowed;

	@Column({ type: "char", length: 1 })
	decimalCharacter: string;

	@Column({ type: "char", length: 5 })
	localeCode: string;

	@Column({ length: 11 })
	currencySymbol: string;
}
