import { BackOfficeDto } from "@modules/back-office-master/dto/backoffice.dto";
import { ProofStatus } from "../entities/validation-doc-master-proof.entity";
import { ApiProperty } from "@nestjs/swagger";
import { DisplayYesNoEnum, DocTypeEnum } from "@utils/enums/Status";
import { RefdocMasterStatusEnum } from "../entities/refdoc-master.entity";

export enum ParticipantBackofficeEnum {
	APPROVED = "APPROVED",
	REJECTED = "REJECTED",
	NEW_PARTICIPANT = "NEW_PARTICIPANT"
}

export type Participant = {
	name: string;
	emailId: string;
	mobile: string;
	status: ProofStatus.APPROVED | ProofStatus.REJECTED | ParticipantBackofficeEnum.NEW_PARTICIPANT;
	rejectedReasonId?: number; // Optional property for 'REJECTED' status,
	id: number;
};

export type PaymentScheduleType = {
	dueDate: Date;
	paymentDueDate: Date;
	amount: number;
	paymentScheduleId: number;
	notes: string;
	modifiedAmount: number;
};

export class ApproveRefDocDto extends BackOfficeDto {
	@ApiProperty()
	refdocId: number;

	@ApiProperty()
	status: RefdocMasterStatusEnum;

	@ApiProperty()
	rejectedReasonId: number;

	@ApiProperty()
	remark: string;

	@ApiProperty()
	firstName: string;

	@ApiProperty()
	middleName: string;

	@ApiProperty()
	lastName: string;

	@ApiProperty()
	suffixName: string;

	@ApiProperty()
	ownerName: string;

	@ApiProperty()
	propertyName: string;

	@ApiProperty()
	participants: Participant[];

	@ApiProperty()
	addressOne: string;

	@ApiProperty()
	addressTwo: string;

	@ApiProperty()
	rentDueDay: number;

	@ApiProperty()
	rentPaymentDueDay: number;

	@ApiProperty()
	city: string;

	@ApiProperty()
	state: string;

	@ApiProperty()
	zip: string;

	@ApiProperty()
	validFrom: Date;

	@ApiProperty()
	validTo: Date;

	@ApiProperty()
	rentAmount: number;

	@ApiProperty()
	baseAmount: number;

	@ApiProperty()
	amount: number;

	@ApiProperty()
	extraDetails: object;

	@ApiProperty()
	docType: DocTypeEnum;

	@ApiProperty()
	masterProofId: number;

	@ApiProperty()
	paymentSchedule: PaymentScheduleType[];

	@ApiProperty()
	variableComponentLease: DisplayYesNoEnum;
}
