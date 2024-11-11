export enum DecimalAllowed {
	YES = "YES",
	NO = "NO"
}

export class CreateGenCurrencyDto {
	currency_code: string;
	currency_description: string;
	country_code: string;
	decimal_allowed: DecimalAllowed;
	decimal_character: string;
	locale_code: string;
	currency_symbol: string;
}
