import { ApiProperty } from "@nestjs/swagger";
import { Status, YNStatusEnum } from "src/utils/enums/Status";

export class UpdateUserReq {
	@ApiProperty()
	businessId: number;
	@ApiProperty()
	channelId: number;
	@ApiProperty()
	systemUserId: string;
	@ApiProperty()
	userType: any;
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
	systemCode: string;
	@ApiProperty()
	primaryIdValue: string;
	@ApiProperty()
	userStatus: string;
	@ApiProperty()
	status: Status;
	@ApiProperty()
	city: string;
	@ApiProperty()
	cityName: string;
	@ApiProperty()
	state: string;
	@ApiProperty()
	country: string;
	@ApiProperty()
	nftWalletBind: string;
	@ApiProperty()
	consumerWalletAddress: string;
	@ApiProperty()
	dateOfBirth: Date;
	@ApiProperty()
	emailVerified: YNStatusEnum;
	@ApiProperty()
	mobileVerified: YNStatusEnum;
}
