import { ApiProperty } from "@nestjs/swagger";

export class AddPayeeDto {
	@ApiProperty()
	payeeType: string;

	@ApiProperty()
	emailId: string;

	@ApiProperty()
	mobile: string;

	@ApiProperty()
	refdocId: number;

	@ApiProperty()
	paymentType: string;

	@ApiProperty()
	name: string;
}
