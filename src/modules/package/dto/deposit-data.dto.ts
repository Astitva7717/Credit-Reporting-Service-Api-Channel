import { YesNoEnum } from "@utils/enums/Status";

export class DepostiDataDto {
	paymentMethodId: string;
	particular: string;
	packageId: string;
	benificiaryUserId: string;
	refDocId: string;
	paymentType: string;
	payeeType: string;
	paymentBy: string;
	cardType: string;
	accNum: string;
	accHolderName: string;
	isParticipant: YesNoEnum;

	constructor(
		paymentMethodId: string,
		particular: string,
		packageId: string,
		benificiaryUserId: string,
		refDocId: string,
		paymentType: string
	) {
		this.paymentMethodId = paymentMethodId;
		this.particular = particular;
		this.packageId = packageId;
		this.benificiaryUserId = benificiaryUserId;
		this.refDocId = refDocId;
		this.paymentType = paymentType;
	}
}
