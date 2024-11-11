import { ApiProperty } from "@nestjs/swagger";
import { MonthlyProofStatusEnum, PaymentTypeCodeEnum } from "@utils/enums/Status";

export class ResolveDisputeDto {
	@ApiProperty()
	disputeHistoryId: number;

	@ApiProperty()
	monthlyProofstatus: MonthlyProofStatusEnum;

	@ApiProperty()
	rejectedReasonId: number;

	@ApiProperty()
	remark: string;

	@ApiProperty()
	transactionId: string;

	@ApiProperty()
	amount: number;

	@ApiProperty()
	transactionDate: Date;

	@ApiProperty()
	veriDocType: PaymentTypeCodeEnum;

	@ApiProperty()
	proofOfPayment: string;

	@ApiProperty()
	amountReceiver: string;

	@ApiProperty()
	routingNumber: string;

	@ApiProperty()
	accountingNumber: string;

	@ApiProperty()
	paymentType: string;

	@ApiProperty()
	bankName: string;

	@ApiProperty()
	moneyOrderSource: string;
}
