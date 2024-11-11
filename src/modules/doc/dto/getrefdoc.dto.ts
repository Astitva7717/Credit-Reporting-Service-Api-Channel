import { BackOfficeDto } from "@modules/back-office-master/dto/backoffice.dto";
import { ApiProperty } from "@nestjs/swagger";
import { DisplayYesNoEnum, DocTypeEnum, PaymentTypeCodeEnum } from "@utils/enums/Status";
import { RefdocMasterStatusEnum } from "../entities/refdoc-master.entity";

export class GetRefdocDto extends BackOfficeDto {
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
	userId: string;

	@ApiProperty({ required: false })
	fromValidTill: Date;

	@ApiProperty({ required: false })
	toValidTill: Date;

	@ApiProperty({ required: false })
	status: RefdocMasterStatusEnum;

	@ApiProperty({ required: false })
	refdocType: string;

	@ApiProperty({ required: false })
	documentType: string;

	@ApiProperty({ required: false })
	page: number;

	@ApiProperty({ required: false })
	limit: number;

	@ApiProperty({ required: false })
	docType: DocTypeEnum;

	@ApiProperty({ required: false })
	paymentType: PaymentTypeCodeEnum;

	@ApiProperty({ required: false })
	masterProofValidTill: Date;

	@ApiProperty({ required: false })
	refdocId: string;

	@ApiProperty({ required: false })
	stateCode: string;

	@ApiProperty({ required: false })
	userStateCode: string;

	@ApiProperty({ required: false })
	leaseStateCode: string;

	@ApiProperty({ required: false })
	userType: string;

	@ApiProperty({ required: false })
	pendingManualPaymentsVerification: DisplayYesNoEnum;
}
