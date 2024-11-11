import { ApiProperty } from "@nestjs/swagger";
import { MasterProofTypeEnum } from "../entities/validation-doc-master-proof.entity";

export class MasterProofDto {
	@ApiProperty()
	masterProofType: MasterProofTypeEnum;

	@ApiProperty({ required: false })
	paymentType: string;
}
