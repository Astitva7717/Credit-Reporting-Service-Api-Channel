import { PaginationDto } from "@modules/doc/dto/pagination.dto";
import { MasterProofTypeEnum } from "@modules/doc/entities/validation-doc-master-proof.entity";
import { PlaidTxnStatus } from "@modules/mongo/entities/mongoPlaidDataEntity";
import { ApiProperty } from "@nestjs/swagger";
import { MonthlyProofStatusEnum, PaymentTypeCodeEnum } from "@utils/enums/Status";

export class FilterKeyWords extends PaginationDto {
	@ApiProperty({ required: false })
	status: MonthlyProofStatusEnum;

	@ApiProperty({ required: false })
	paymentType: PaymentTypeCodeEnum;

	@ApiProperty({ required: false })
	userName: string;

	@ApiProperty({ required: false })
	name: string;

	@ApiProperty({ required: false })
	ssnId: string;

	@ApiProperty({ required: false })
	emailId: string;

	@ApiProperty({ required: false })
	mobileNo: string;

	@ApiProperty({ required: false })
	refdocType: string;

	@ApiProperty({ required: false })
	refdocId: string;

	@ApiProperty({ required: false })
	masterProofId: number;

	@ApiProperty({ required: false })
	masterProofType: MasterProofTypeEnum;

	@ApiProperty({ required: false })
	paymentMonth: string;

	@ApiProperty({ required: false })
	paymentYear: number;

	@ApiProperty({ required: false })
	state: string;

	@ApiProperty({ required: false })
	customerId: number;

	@ApiProperty({ required: false })
	plaidTxnStatus: PlaidTxnStatus;

	@ApiProperty({ required: false })
	disputeId: number;
}

export class GetMontlyProofDto extends FilterKeyWords {}
