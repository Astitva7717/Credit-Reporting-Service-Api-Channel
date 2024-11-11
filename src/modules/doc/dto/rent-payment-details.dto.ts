import { RefDocIdDto } from "@modules/plaid/dto/refdoc-id.dto";
import { ApiProperty } from "@nestjs/swagger";
import { YesNoEnum } from "@utils/enums/Status";

export class SaveRentPaymentDetails extends RefDocIdDto {
	@ApiProperty()
	self: YesNoEnum;

	@ApiProperty()
	paymentRequest: YesNoEnum;

	@ApiProperty()
	participant: YesNoEnum;

	@ApiProperty()
	isPrimaryUser: YesNoEnum;
}
