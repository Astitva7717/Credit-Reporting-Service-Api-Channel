import { ApiProperty } from "@nestjs/swagger";
import { RefDocIdDto } from "./refdoc-id.dto";
import { AppTypeEnum, PayeeTypeEnum } from "@utils/enums/Status";

export class GenerateLinkTokenDto extends RefDocIdDto {
	@ApiProperty()
	payeeType: PayeeTypeEnum;

	@ApiProperty()
	benificiaryUserId: number;

	@ApiProperty()
	paymentType: string;

	@ApiProperty()
	appType: AppTypeEnum;
}
