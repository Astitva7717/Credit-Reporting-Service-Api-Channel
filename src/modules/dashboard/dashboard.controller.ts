import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";
import { DashboardService } from "./dashboard.service";

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("Dashboard")
@Controller("")
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	//v1.0
	@Get("v1.0/getSubscriptionData")
	@ApiOperation({ summary: "Get subscription data." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	getSubscriptionData() {
		return this.dashboardService.getSubscriptionDataMongo();
	}

	//v1.0
	@Get("v1.0/getSubscriptionAmountCollectedData")
	@ApiOperation({ summary: "Get subscription amount collected." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	getSubscriptionAmountCollectedData() {
		return this.dashboardService.getSubscriptionAmountCollectedDataMongo();
	}

	//v1.0
	@Get("v1.0/getSnapshotData")
	@ApiOperation({ summary: "Get snapshot data." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	getSnapshotData() {
		return this.dashboardService.getSnapshotData();
	}
	//v1.0
	@Get("v1.0/getTotalReporting")
	@ApiOperation({ summary: "Get total reporting data." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	getTotalReportingData() {
		return this.dashboardService.getTotalReportingData();
	}
	//v1.0
	@Get("v1.0/getSnapshotCumulative")
	@ApiOperation({ summary: "Get snapshot cumulative data." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	getSnapshotCumulative() {
		return this.dashboardService.getSnapshotCumulativeData();
	}
	//v1.0
	@Get("v1.0/getDisputeChart")
	@ApiOperation({ summary: "Get dispute chart data." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	getDisputeChart() {
		return this.dashboardService.getDisputeChartDataMongo();
	}
	//v1.0
	@Get("v1.0/getPendingSummary")
	@ApiOperation({ summary: "Get pending summary data." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	getPendingSummary() {
		return this.dashboardService.getPendingSummary();
	}

	@Post("v1.0/updateWeeklyDashboardData")
	@ApiOperation({ summary: "Update weekly dashboard data." })
	updateWeeklyDashboardData() {
		return this.dashboardService.updateWeeklyDashboardData();
	}

	@Post("v1.0/updateMonthlyDashboardData")
	@ApiOperation({ summary: "Update monthly dashboard data." })
	updateMonthlyDashboardData() {
		return this.dashboardService.updateMonthlyDashboardData();
	}

	@Post("v1.0/updateEightWeeksDashboardData")
	@ApiOperation({ summary: "Update eight weeks dashboard data." })
	updateEightWeeksDashboardData() {
		return this.dashboardService.updateEightWeeksDashboardData();
	}
}
