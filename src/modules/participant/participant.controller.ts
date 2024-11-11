import { Controller, Get, UseGuards, Request, Query, Post, Body } from "@nestjs/common";
import { ParticipantService } from "./participant.service";
import { ApiHeaders, ApiOperation, ApiTags } from "@nestjs/swagger";
import { GetInvitedData } from "./dto/get-invited-data.dto";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";
import { InviteParticipantAppDto } from "./dto/invite-participant-app.dto";
import postloginDto from "@modules/doc/dto/postlogin.dto";

@ApiTags("Participants Management")
@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@Controller("")
export class ParticipantController {
	constructor(private readonly participantService: ParticipantService) {}

	//preLogin

	@Get("preLogin/verifyInviteeCode")
	@ApiHeaders([{ name: "clientCode", description: "Client Code", required: true }])
	@ApiOperation({ summary: "Invite participant." })
	async verifyInviteeCode(@Query() verifyInviteeCodeDto: GetInvitedData, @Request() request) {
		return this.participantService.verifyInviteeCode(verifyInviteeCodeDto, request);
	}

	@Post("postLogin/inviteParticipant")
	@ApiHeaders(postloginDto)
	@ApiOperation({ summary: "Invite participant from application" })
	inviteParticipantFromApp(@Body() body: InviteParticipantAppDto, @Request() request: any) {
		return this.participantService.inviteParticipantFromApp(body, request);
	}
}
