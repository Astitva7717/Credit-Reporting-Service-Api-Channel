import { ApiProperty } from "@nestjs/swagger";

export class GetDropDownOptionsDto {
	@ApiProperty()
	dropdownName: string;

    @ApiProperty()
	pageName: string;
}
