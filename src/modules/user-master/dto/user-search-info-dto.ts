import { PaginationDto } from "@modules/doc/dto/pagination.dto";
import { ApiProperty } from "@nestjs/swagger";
import { YNStatusEnum } from "@utils/enums/Status";
import { UserType } from "@utils/enums/user-types";

export class UserSearchinfoDto extends PaginationDto {
	@ApiProperty()
	userId: number;

	@ApiProperty()
	refdocId: number;

	@ApiProperty()
	status: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	fromDob: Date;

	@ApiProperty()
	toDob: Date;

	@ApiProperty()
	registrationFrom: Date;

	@ApiProperty()
	registrationTill: Date;

	@ApiProperty()
	mobileNo: string;

	@ApiProperty()
	mobileCode: string;

	@ApiProperty()
	emailId: string;

	@ApiProperty()
	country: string;

	@ApiProperty()
	state: string;

	@ApiProperty()
	city: string;

	@ApiProperty()
	ssn: string;
	@ApiProperty()
	ssnVerified: YNStatusEnum;
	@ApiProperty()
	emailVerified: YNStatusEnum;
	@ApiProperty()
	mobileVerified: YNStatusEnum;
	@ApiProperty()
	refDocParticipant: YNStatusEnum;
	@ApiProperty()
	payDocParticipant: YNStatusEnum;
	@ApiProperty()
	veriDocParticipant: YNStatusEnum;
	@ApiProperty()
	userType: UserType;
}
