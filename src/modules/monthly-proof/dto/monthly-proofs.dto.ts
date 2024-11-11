import { RefDocIdDto } from "@modules/plaid/dto/refdoc-id.dto";
import { ApiProperty } from "@nestjs/swagger";

export enum TypeEnum {
	DISPUTE = "DISPUTE",
	MONTHLY = "MONTHLY"
}
export class MonthlyProofsDto extends RefDocIdDto {
	@ApiProperty()
	type: TypeEnum;

	@ApiProperty()
	month: number;

	@ApiProperty()
	year: number;
}
