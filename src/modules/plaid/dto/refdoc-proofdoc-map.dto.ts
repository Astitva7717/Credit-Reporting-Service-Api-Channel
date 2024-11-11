import { ApiProperty } from "@nestjs/swagger";
import { RefDocIdDto } from "./refdoc-id.dto";

export class RefDocValidationProofDocMappingDto extends RefDocIdDto {
	@ApiProperty({
		type:'array',
		items:{
			type:'number'
		}
	})
	masterProofIds: number[];
}
