import { RefDocIdDto } from "@modules/plaid/dto/refdoc-id.dto";
import { ApiProperty } from "@nestjs/swagger";
import { InviteMethodType, LeaseParticipantType, ParticipantUserType } from "@utils/enums/Status";

export interface LeaseParticipant {
	type: LeaseParticipantType;
	name: string;
	inviteMethod: InviteMethodType;
	invitationData: string;
}

export class RentDetailsDto extends RefDocIdDto {
	@ApiProperty({
		type: "object",
		properties: {
			type: { type: "string" },
			name: { type: "string" },
			inviteMethod: { type: "string" },
			invitationData: { type: "string" }
		}
	})
	leaseParticipants: LeaseParticipant;

	@ApiProperty()
	userType: ParticipantUserType;
}
