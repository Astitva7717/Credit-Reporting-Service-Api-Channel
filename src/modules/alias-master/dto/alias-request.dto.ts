import { ApiProperty } from "@nestjs/swagger";

export class AliasRequestBean {
	@ApiProperty()
	ucmChannelId: number;

	@ApiProperty()
	ucmAliasName: string;

	@ApiProperty()
	ucmBusinessId: number;

	@ApiProperty()
	status: string;

	@ApiProperty()
	ucmAliasId: number;
}
