import { SaveProofDto } from "@modules/monthly-proof/dto/save-proof.dto";
import { ApiProperty } from "@nestjs/swagger";

export class RaiseDisputeDto extends SaveProofDto {
	@ApiProperty()
	discription: string;

	@ApiProperty()
	disputeReasonId: number;
}
