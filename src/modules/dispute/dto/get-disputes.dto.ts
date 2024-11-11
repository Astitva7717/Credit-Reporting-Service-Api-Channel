import { PaginationDto } from "@modules/doc/dto/pagination.dto";
import { ApiProperty } from "@nestjs/swagger";
import { DisputeStatusEnum } from "../entities/dispute.entity";
import { PaymentTypeCodeEnum } from "@utils/enums/Status";
import { PaymentScheduleStatus } from "@modules/doc/entities/payment-schedule.entity";
export class GetDisputeDto extends PaginationDto {
	@ApiProperty()
	disputeStatus: DisputeStatusEnum;

	@ApiProperty()
	monthlyProofStatus: PaymentScheduleStatus;

	@ApiProperty()
	reason: string;

	@ApiProperty()
	refdocId: number;

	@ApiProperty()
	name: string;

	@ApiProperty()
	emailId: string;

	@ApiProperty()
	mobileNo: string;

	@ApiProperty()
	paymentType: PaymentTypeCodeEnum;

	@ApiProperty()
	disputeId: number;
}
