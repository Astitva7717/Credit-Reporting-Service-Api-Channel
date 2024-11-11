import { ApiProperty } from "@nestjs/swagger";
import { RefDocIdDto } from "./refdoc-id.dto";

export class GenerateAccessTokenDto extends RefDocIdDto {
	@ApiProperty()
	publicToken: string;

	@ApiProperty()
	paymentType: string;

	@ApiProperty()
	linkToken:string;
}
