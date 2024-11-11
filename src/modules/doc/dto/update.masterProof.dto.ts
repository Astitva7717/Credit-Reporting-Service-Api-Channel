import { ApiProperty } from "@nestjs/swagger";
import { ProofStatus } from "../entities/validation-doc-master-proof.entity";

export class UpdateMasterProofDto {
	@ApiProperty()
	refdocId: number;

	@ApiProperty()
	masterProofId: number;

	@ApiProperty()
	status: ProofStatus;

	@ApiProperty()
	rejectedReasonId: number;

	@ApiProperty()
	remark: string;

	@ApiProperty()
	flexStartDate: string;

	@ApiProperty()
	flexEndDate: string;
}
