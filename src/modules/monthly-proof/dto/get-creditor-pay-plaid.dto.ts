import { PaginationDto } from "@modules/doc/dto/pagination.dto";
import { MonthMatchingStatus, PlaidTxnStatus } from "@modules/mongo/entities/mongoPlaidDataEntity";
import { ApiProperty } from "@nestjs/swagger";

export class GetCreditorPayPlaidDataDto extends PaginationDto {
	@ApiProperty()
	plaidTxnStatus: PlaidTxnStatus;

	@ApiProperty()
	monthMatchingStatus: MonthMatchingStatus;

	@ApiProperty({ required: false })
	paymentMonth: string;

	@ApiProperty({ required: false })
	paymentYear: number;

	@ApiProperty({ required: false })
	leaseId: number;

	@ApiProperty({ required: false })
	customerId: number;

	@ApiProperty({ required: false })
	state: string;
}
