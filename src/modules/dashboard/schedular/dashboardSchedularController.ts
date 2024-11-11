import { Controller, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";
import { DashboardSchedularService } from "./dashboardSchedularServices";

 @UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("Dashboard Schedular Management")
@Controller("")
export class DashboardSchedularController {
	constructor(private readonly dashboardSchedularService: DashboardSchedularService) {}
	@Post("rescheduleAllowed/updatePreviousDayDashboardData")
	@ApiOperation({ summary: "update previous day dashboard reschedular." })
	updateCurrentDayDashboardData() {
		return this.dashboardSchedularService.updatePreviousDayDashboardData();
	}
}
