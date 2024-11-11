import { ApiProperty } from "@nestjs/swagger";
import { Status, YNStatusEnum } from "src/utils/enums/Status";

export class UserRegistrationRequest {
	@ApiProperty()
	businessId: number;
	@ApiProperty()
	channelId: number;
	@ApiProperty()
	aliasId: number;
	@ApiProperty()
	aliasName: string;
	@ApiProperty()
	systemUserId: string;
	@ApiProperty()
	userType: string;
	@ApiProperty()
	mobileCode: string;
	@ApiProperty()
	mobileNo: string;
	@ApiProperty()
	emailId: string;
	@ApiProperty()
	username: string;
	@ApiProperty()
	firstName: string;
	@ApiProperty()
	middleName: string;
	@ApiProperty()
	lastName: string;
	@ApiProperty()
	cityCode: string;
	@ApiProperty()
	stateCode: string;
	@ApiProperty()
	countryCode: string;
	@ApiProperty()
	zipCode: string;
	@ApiProperty()
	addressOne: string;
	@ApiProperty()
	addressTwo: string;
	@ApiProperty()
	fcmIdAndroid: string;
	@ApiProperty()
	fcmIdIos: string;
	@ApiProperty()
	currencyCode: string;
	@ApiProperty()
	status: Status = Status.ACTIVE;
	@ApiProperty()
	city: string;
	@ApiProperty()
	cityName: string;
	@ApiProperty()
	state: string;
	@ApiProperty()
	country: string;
	createdAt: Date;
	updatedAt: Date;
	@ApiProperty()
	zip: string;
	@ApiProperty()
	nftWalletBind: string;
	@ApiProperty()
	primaryIdValue: string;
	@ApiProperty()
	inviteCode: string;
	@ApiProperty()
	userId: number;
	@ApiProperty()
	dateOfBirth: Date;
	@ApiProperty()
	emailVerified: YNStatusEnum;
	@ApiProperty()
	mobileVerified: YNStatusEnum;
}
