import { ApiProperty } from "@nestjs/swagger";

export class AssignMonthDto {
	@ApiProperty()
	transactionId: string;

	@ApiProperty()
	month: string;

	@ApiProperty()
	year: number;
}
