import { ApiProperty } from "@nestjs/swagger";
import { SaveProofDto } from "./save-proof.dto";

export class SaveMonthlyProofDto extends SaveProofDto {
	@ApiProperty()
	discription: string;
}
