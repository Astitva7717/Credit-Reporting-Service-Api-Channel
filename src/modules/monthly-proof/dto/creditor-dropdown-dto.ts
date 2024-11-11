import { PlaidTxnStatus } from "@modules/mongo/entities/mongoPlaidDataEntity";
import { ApiProperty } from "@nestjs/swagger";

export class CreditorDropdownDto {
	@ApiProperty()
	refdocId: number;

	@ApiProperty()
	plaidTxnStatus: PlaidTxnStatus;
}
