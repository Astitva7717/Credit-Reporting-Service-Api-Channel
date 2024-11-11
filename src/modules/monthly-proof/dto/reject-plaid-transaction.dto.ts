import { ApiProperty } from "@nestjs/swagger";

export class RejectPlaidDto {
	@ApiProperty()
	transactionIds: string[];

	@ApiProperty()
	refdocId: number;
}
