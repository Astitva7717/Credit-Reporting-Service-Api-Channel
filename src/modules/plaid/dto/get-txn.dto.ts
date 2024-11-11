import { ApiProperty } from "@nestjs/swagger";
import { RefdocTypeIdDto } from "./refdoc-type-id-dto";

export class GetTxnDto extends RefdocTypeIdDto {
	@ApiProperty()
	fromDate: string; //'yyyy-mm-dd'

	@ApiProperty()
	toDate: string;
}
