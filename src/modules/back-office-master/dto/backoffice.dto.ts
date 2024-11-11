import { ApiProperty } from "@nestjs/swagger";

export class BackOfficeDto {
	@ApiProperty()
	businessId: number;

	@ApiProperty()
	channelId: number;
}
