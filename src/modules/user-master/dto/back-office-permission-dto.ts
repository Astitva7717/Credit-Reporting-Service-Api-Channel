import { PaginationDto } from "@modules/doc/dto/pagination.dto";
import { ApiProperty } from "@nestjs/swagger";
import { YNStatusEnum } from "@utils/enums/Status";

export class BackOfficePermissionsDto extends PaginationDto {
	@ApiProperty()
	username: string;

	@ApiProperty()
	ssn: YNStatusEnum;

	@ApiProperty()
	phone: YNStatusEnum;

	@ApiProperty()
	email: YNStatusEnum;
}
