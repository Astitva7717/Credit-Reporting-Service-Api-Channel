import { ApiProperty } from "@nestjs/swagger";

export class CreateParticipantDto {
	// @ApiProperty()
	// primaryIdValue: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	emailId: string;

	@ApiProperty()
	mobile: string;

	@ApiProperty()
	paymentBy: string;

	@ApiProperty()
	refdocId: number;

	@ApiProperty()
	packageId: number;
}
