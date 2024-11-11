import { ApiProperty } from "@nestjs/swagger";
import { MasterProofTypeEnum } from "../entities/validation-doc-master-proof.entity";
import { YesNoEnum } from "@utils/enums/Status";
import { RefDocIdDto } from "@modules/plaid/dto/refdoc-id.dto";

export class SaveMasterProofDto extends RefDocIdDto {
	@ApiProperty()
	masterProofType: MasterProofTypeEnum;

	@ApiProperty()
	paymentType: string;

	@ApiProperty()
	isOtherPayee: YesNoEnum;

	@ApiProperty()
	benificiaryUserId: number;

	@ApiProperty()
	plaidTokenId: number;

	@ApiProperty()
	description: string;
}