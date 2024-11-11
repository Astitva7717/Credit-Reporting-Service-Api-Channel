import { ApiProperty } from "@nestjs/swagger";
import { ConfigCodes } from "./config-codes";

export class UpdateConfigurationsRequest {
	@ApiProperty()
	configs: ConfigCodes[];
}
