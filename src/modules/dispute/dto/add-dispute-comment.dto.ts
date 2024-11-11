import { ApiProperty } from "@nestjs/swagger";

export class AddDisputeCommentDto{
    @ApiProperty()
    disputeId:number;

    @ApiProperty()
    comment:string;
}