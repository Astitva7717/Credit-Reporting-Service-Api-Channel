import { Controller, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";
import { MonthlyProofSchedularService } from "./monthlyschedularService";

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("Monthly Schedular Management")
@Controller("")
export class MonthlyProofSchedularController {
	constructor(private readonly monthlySchedularService: MonthlyProofSchedularService) {}

	@Post("rescheduleAllowed/fetchPlaidData")
	@ApiOperation({ summary: "fetch plaid data reschedular." })
	fetchPlaidData() {
		return this.monthlySchedularService.fetchPlaidData();
	}

	@Post("rescheduleAllowed/updateMonthlyProofData")
	@ApiOperation({ summary: "update monthly proof reschedular." })
	updateMonthlyProofData() {
		return this.monthlySchedularService.updateMontlyProofData();
	}

	@Post("rescheduleAllowed/fetchLookBackPlaidData")
	@ApiOperation({ summary: "fetch plaid data reschedular." })
	fetchLookBackPlaidData() {
		return this.monthlySchedularService.fetchLookBackPlaidData();
	}

	@Post("rescheduleAllowed/verifyPlaidTransaction")
	@ApiOperation({ summary: "Verify plaid transactions." })
	verifyPlaidTransactions() {
		return this.monthlySchedularService.verifyPlaidTransactions();
	}

	@Post("rescheduleAllowed/handleQualifiedMonthlyProofs")
	@ApiOperation({ summary: "handle Qualified MonthlyProofs." })
	handleQualifiedMonthlyProofs() {
		return this.monthlySchedularService.handleQualifiedMonthlyProofs();
	}
}
