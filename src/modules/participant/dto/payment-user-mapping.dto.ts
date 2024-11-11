import { ApiProperty } from "@nestjs/swagger";

export class PaymentUserMappingReqDto {
	@ApiProperty()
	paymentType: string;

	@ApiProperty()
	emailId: string;

	@ApiProperty()
	mobile: string;

	@ApiProperty()
	refdocId: number;
}
