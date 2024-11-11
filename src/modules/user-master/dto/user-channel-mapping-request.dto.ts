import { ApiProperty } from "@nestjs/swagger";

export class UserChannelMappingRequest {
	@ApiProperty()
	businessId: number;

	@ApiProperty()
	systemUserId: string;

	@ApiProperty()
	channelIdsAndStatus: any;

	@ApiProperty()
	userType: string;
}
