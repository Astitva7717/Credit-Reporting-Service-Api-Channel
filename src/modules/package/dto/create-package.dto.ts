import { ApiProperty } from "@nestjs/swagger";

export class CreatePackageDto {
	@ApiProperty()
	name: string;

	@ApiProperty()
	description: string;

	@ApiProperty()
	code: string;
	
	@ApiProperty()
	firstUnitPrice: number;
	
	@ApiProperty()
	otherUnitPrice: number;
	
	@ApiProperty()
	firstUnitPriceStudent: number;
	
	@ApiProperty()
	otherUnitPriceStudent: number;
	
	@ApiProperty()
	refdocTypeId: number;
}
