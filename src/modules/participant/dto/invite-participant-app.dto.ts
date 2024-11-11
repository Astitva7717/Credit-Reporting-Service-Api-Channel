import { ApiProperty } from "@nestjs/swagger";
import { InviteMethodType } from "@utils/enums/Status";

export class InviteParticipantAppDto {
	@ApiProperty()
	participantMapRequestId: number;

	@ApiProperty()
	name: string;

	@ApiProperty()
	inviteMethod: InviteMethodType;

	@ApiProperty()
	invitationData: string;

	@ApiProperty()
	mobileCode: string;
}
