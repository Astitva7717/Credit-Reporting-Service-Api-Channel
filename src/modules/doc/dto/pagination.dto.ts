import { ApiProperty } from "@nestjs/swagger";

export class PaginationDto{
    @ApiProperty({required:false})
    page:number;

    @ApiProperty({required:false})
    limit:number;
}