import { ApiProperty } from "@nestjs/swagger";

export class CreateCatgoryDto {
	@ApiProperty()
	categoryName: string;
}
