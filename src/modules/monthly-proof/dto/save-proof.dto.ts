import { ApiProperty } from "@nestjs/swagger";

export class SaveProofDto {
	@ApiProperty()
	masterProofId: number;

	@ApiProperty()
	month: number;

	@ApiProperty()
	year: number;
}
