import { ApiProperty } from "@nestjs/swagger";

export class QualifyPlaidTxnsDto {
	@ApiProperty()
	transactionIds: string[];

	@ApiProperty()
	refdocId: number;
}
