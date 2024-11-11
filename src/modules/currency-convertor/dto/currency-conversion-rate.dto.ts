export enum ExchangeType {
	DEPOSIT = "DEPOSIT",
	WITHDRAWAL = "WITHDRAWAL",
	DEPOSIT_TOKEN = "DEPOSIT_TOKEN",
	FUND_TRANSFER_IN = "FUND_TRANSFER_IN"
}
export class CreateCurrencyConversionRateDto {
	fromCurrency: string;
	exchangeType: ExchangeType;
	toCurrency: string;
	exchangeRate: string;
	exchangeCharges: string;
	exchangeCurrency: string;
}

export class NewArray {
	conversions: CreateCurrencyConversionRateDto[];
}
