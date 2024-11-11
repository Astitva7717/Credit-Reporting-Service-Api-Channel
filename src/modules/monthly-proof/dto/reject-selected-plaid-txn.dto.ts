import { ApiProperty } from "@nestjs/swagger";

export class RejectSelectedPlaidTxnDto {
	@ApiProperty()
	txnsInfo: any;

	@ApiProperty()
	txnId: string[];

	@ApiProperty()
	refdocId: number;
}
