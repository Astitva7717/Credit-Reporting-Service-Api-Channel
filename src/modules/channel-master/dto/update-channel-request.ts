import { Status } from "src/modules/business-master/entities/business-configuration-master-entity";
import { ConfigCodes } from "./config-codes";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateChannelRequest {
	@ApiProperty()
	ucmChannelId: number;

	@ApiProperty()
	ucmBusinessId: number;

	@ApiProperty()
	currencyCode: string;

	@ApiProperty()
	channelType: string;

	@ApiProperty()
	ucmChannelName: string;

	@ApiProperty()
	configs: ConfigCodes[];

	@ApiProperty()
	status: Status;
}
