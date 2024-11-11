import { ApiProperty } from "@nestjs/swagger";
import { UserType } from "@utils/enums/user-types";

export class GetUserInfo {
	@ApiProperty()
	userId: number;

	@ApiProperty()
	userType: UserType;
}
