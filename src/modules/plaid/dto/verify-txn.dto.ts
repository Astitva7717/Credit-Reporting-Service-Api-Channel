import { ApiProperty } from "@nestjs/swagger";

export class VerifyTxnIdDto{
    @ApiProperty()
    transactionId:string;

    @ApiProperty()
    date:string; //yyyy-mm-dd

    @ApiProperty()
    amount:number;
}