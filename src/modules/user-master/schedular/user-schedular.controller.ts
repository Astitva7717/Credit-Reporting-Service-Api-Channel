import { Controller, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";
import { UserSchedularService } from "./user-schedular.service";

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("User-Master Schedular Management")
@Controller("")
export class UserSchedularController {
	constructor(private readonly userSchedularService: UserSchedularService) {}

	@Post("rescheduleAllowed/kafkaUserRegistrationFailedCorrection")
	@ApiOperation({ summary: "Kafka user registration failed correction Reshedular." })
	kafkaUserRegistrationFailedCorrection() {
		return this.userSchedularService.kafkaUserRegistrationFailedCorrection();
	}

	@Post("rescheduleAllowed/kafkaUserUpdateFailedCorrection")
	@ApiOperation({ summary: "kafka user update failed correction Reshedular." })
	kafkaUserUpdateFailedCorrection() {
		return this.userSchedularService.kafkaUserUpdateFailedCorrection();
	}
}
