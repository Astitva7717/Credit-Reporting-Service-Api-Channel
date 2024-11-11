import { ApiProperty } from "@nestjs/swagger";
export class DocMasterProofDto {
	@ApiProperty()
	refdocId: number;
}
