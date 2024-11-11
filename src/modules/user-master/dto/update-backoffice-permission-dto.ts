import { ApiProperty } from "@nestjs/swagger";
import { YNStatusEnum } from "@utils/enums/Status";

type backOfficePermissionData = {
	userId: number;
	username: string;
	ssn: YNStatusEnum;
	email: YNStatusEnum;
	phone: YNStatusEnum;
};

export class UpdateBackOfficePermissionDto {
	@ApiProperty()
	userPermissionData: backOfficePermissionData[];
}
