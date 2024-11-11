import { ExchangeType } from "./currency-conversion-rate.dto";

export class ConversionDto {
	exchangeType: ExchangeType;
	fromCurrencyCode: string;
	toCurrencyCode: string;
	amount: number;
}
