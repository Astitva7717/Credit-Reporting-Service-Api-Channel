import { ApiProperty } from "@nestjs/swagger";
import { InviteeTypeEnum, SubscriptionPaymentTypeEnum, YesNoEnum } from "@utils/enums/Status";

export class PurchaseInitiateDto {
	@ApiProperty()
	packageId: number;

	@ApiProperty()
	benificiaryUserId: number;

	@ApiProperty()
	refDocId: number;

	@ApiProperty()
	deviceType: string;

	@ApiProperty()
	paymentTypeCode: string;

	@ApiProperty()
	userAgent: string;

	@ApiProperty()
	paymentTypeId: number;

	@ApiProperty()
	subTypeId: number;

	@ApiProperty()
	paymentType:SubscriptionPaymentTypeEnum;

	@ApiProperty()
	paymentMethodId:string;

	@ApiProperty()
	payeeType:InviteeTypeEnum;

	@ApiProperty()
	isParticipant:YesNoEnum;
}
