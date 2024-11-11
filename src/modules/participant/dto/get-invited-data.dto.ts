import { ApiProperty } from "@nestjs/swagger";
import { InviteeTypeEnum } from "@utils/enums/Status";

export class GetInvitedData{
    @ApiProperty()
    verificationCode:string;
    
    @ApiProperty()
    inviteeType:InviteeTypeEnum;
}