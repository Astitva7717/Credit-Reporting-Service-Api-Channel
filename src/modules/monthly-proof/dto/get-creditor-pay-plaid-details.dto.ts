import { MonthMatchingStatus, PlaidTxnStatus } from "@modules/mongo/entities/mongoPlaidDataEntity";
import { ApiProperty } from "@nestjs/swagger";

export class GetCreditorPayPlaidDetailsDto {
	@ApiProperty()
	refdocId: number;

	@ApiProperty()
	customerId: number;

	@ApiProperty()
	month: string;

	@ApiProperty()
	year: number;

	@ApiProperty()
	plaidTxnStatus: PlaidTxnStatus;

	@ApiProperty()
	monthMatchingStatus: MonthMatchingStatus;
}
