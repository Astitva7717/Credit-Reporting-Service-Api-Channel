import { ApiProperty } from "@nestjs/swagger";
import { ConfigCodes } from "src/modules/channel-master/dto/config-codes";

export class BusinessRegistrationRequest {
	@ApiProperty()
	ucmBusinessId: number;

	@ApiProperty()
	businessCode: string;

	@ApiProperty()
	businessName: string;

	@ApiProperty()
	contactPerson: string;

	@ApiProperty()
	mobileNumber: string;

	@ApiProperty()
	mobileCode: string;

	@ApiProperty()
	phoneNumber: string;

	@ApiProperty()
	phoneCode: string;

	@ApiProperty()
	emailId: string;

	@ApiProperty()
	addressOne: string;

	@ApiProperty()
	addressTwo: string;

	@ApiProperty()
	zipCode: string;

	@ApiProperty()
	cityCode: string;

	@ApiProperty()
	stateCode: string;

	@ApiProperty()
	countryCode: string;

	@ApiProperty()
	configs: ConfigCodes[];

	@ApiProperty()
	city: string;

	@ApiProperty()
	cityName: string;

	@ApiProperty()
	state: string;

	@ApiProperty()
	country: string;

	@ApiProperty()
	status: string;
}
