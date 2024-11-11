import { ApiProperty } from "@nestjs/swagger";
import { InviteeTypeEnum, PackagePaymentByEnum, SubscriptionPaymentTypeEnum, YesNoEnum } from "@utils/enums/Status";

export class KafkaPurchaseInititateDto {
	@ApiProperty()
	packageId: number;

	@ApiProperty()
	userId: number;

	@ApiProperty()
	benificiaryUserId: number;

	@ApiProperty()
	refDocId: number;

	@ApiProperty()
	paymentType: SubscriptionPaymentTypeEnum;

	@ApiProperty()
	paymentMethodId: string;

	@ApiProperty()
	isParticipant: YesNoEnum;

	@ApiProperty()
	payeeType: InviteeTypeEnum;

	@ApiProperty()
	paymentId: string;

	@ApiProperty()
	paymentBy: PackagePaymentByEnum;

	@ApiProperty()
	amount: string;
}
