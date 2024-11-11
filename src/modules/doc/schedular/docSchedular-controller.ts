import { Controller, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { DocSchedularService } from "./docSchedularService";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("Doc Schedular Management")
@Controller("")
export class DocSchedularController {
	constructor(private readonly docSchedularService: DocSchedularService) {}
	@Post("rescheduleAllowed/expireRefdocs")
	@ApiOperation({ summary: "update refdoc expiration status Reschedular." })
	expireRefdocs() {
		return this.docSchedularService.expireRefdocs();
	}

	@Post("rescheduleAllowed/schedularUpdate")
	@ApiOperation({ summary: "update schedular running status Reschedular." })
	schedularUpdate() {
		return this.docSchedularService.schedularUpdate();
	}
}
