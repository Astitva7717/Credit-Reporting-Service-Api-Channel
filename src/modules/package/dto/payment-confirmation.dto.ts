import { ApiProperty } from "@nestjs/swagger";
import { PaymentStatusEnum } from "@utils/enums/Status";

export class PaymentConfirmationDto {
	@ApiProperty()
	transactionId: number;

	@ApiProperty()
	status: PaymentStatusEnum;

	@ApiProperty()
	referenceId: string;
}
