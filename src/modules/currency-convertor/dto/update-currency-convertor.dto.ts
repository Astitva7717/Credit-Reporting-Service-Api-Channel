import { PartialType } from "@nestjs/mapped-types";
import { CreateCurrencyConversionRateDto } from "./currency-conversion-rate.dto";

export class UpdateCurrencyConvertorDto extends PartialType(CreateCurrencyConversionRateDto) {}
