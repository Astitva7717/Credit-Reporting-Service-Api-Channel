import { ApiProperty } from "@nestjs/swagger";
import { ConfigCodes } from "./config-codes";

export class ChannelRegistrationRequest {
	@ApiProperty()
	ucmChannelName: string;

	@ApiProperty()
	ucmChannelId: number;

	@ApiProperty()
	ucmBusinessId: number;

	@ApiProperty()
	currencyCode: string;

	@ApiProperty()
	channelType: string;

	@ApiProperty()
	configs: ConfigCodes[];
}
