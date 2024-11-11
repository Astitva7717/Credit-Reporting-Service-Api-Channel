import { ApiProperty } from "@nestjs/swagger";
import { RefDocIdDto } from "./refdoc-id.dto";

export class GetAccountDetailsDto extends RefDocIdDto{
    @ApiProperty()
    paymentType:string;
}