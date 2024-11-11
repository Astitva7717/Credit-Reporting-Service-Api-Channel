import { PaginationDto } from "@modules/doc/dto/pagination.dto";
import { ApiProperty } from "@nestjs/swagger";

export class GetCollegeListDto extends PaginationDto{
    @ApiProperty({required:false})
    q:string;
}