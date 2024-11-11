import { Injectable } from "@nestjs/common";
import { SchedulerHelperService } from "@utils/common/scheduler-helper/scheduler-helper.service";
import { Cron } from "@nestjs/schedule";
import { AppLoggerDto } from "@app-logger/app-logger.dto";
import VariablesConstant from "@utils/variables-constant";
import { AppLoggerService } from "@app-logger/app-logger.service";
import { DashboardDaoService } from "@modules/dao/dashboard-dao/dashboard-dao.service";
import { PaymentStatusEnum, YesNoEnum } from "@utils/enums/Status";
import { DashboardWeeklyData } from "@modules/mongo/entities/dashboardWeeklyDataEntity";
import { MongoDaoService } from "@modules/dao/mongo-dao/mongo-dao.service";
import { DashboardMonthlyData } from "@modules/mongo/entities/dashboardMonthlyDataEntity";
import { MonthMapEnum } from "@utils/constants/map-month-constants";
import { DashboardHelperService } from "../dashboard-helper/dashboard-helper.service";
import { DashboardEightWeeksData } from "@modules/mongo/entities/dashboardEightWeeksDataEntity";

@Injectable()
export class DashboardSchedularService {
	constructor(
		private readonly schedularHelperService: SchedulerHelperService,
		private readonly appLoggerService: AppLoggerService,
		private readonly dashboardDaoService: DashboardDaoService,
		private readonly dashboardHelperService: DashboardHelperService,
		private readonly mongoDaoService: MongoDaoService
	) {}

	async updatePreviousDayDashboardData() {
		const endDateWithTime = new Date();
		let startDate = new Date(endDateWithTime.getFullYear(), endDateWithTime.getMonth(), endDateWithTime.getDate() - 1);
		startDate.setHours(0);
		startDate.setMinutes(0);
		startDate.setSeconds(0);
		startDate.setMilliseconds(0);
		endDateWithTime.setHours(0);
		endDateWithTime.setMinutes(0);
		endDateWithTime.setSeconds(0);
		endDateWithTime.setMilliseconds(0);
		const currentDayNewSubsData = await this.dashboardDaoService.getWeeklySubscriptionData(
			startDate,
			endDateWithTime,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.YES
		);
		const currentDayOldSubsData = await this.dashboardDaoService.getWeeklySubscriptionData(
			startDate,
			endDateWithTime,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.NO
		);
		const currentDayNewSubsAmountData = await this.dashboardDaoService.getWeeklySubscriptionAmountData(
			startDate,
			endDateWithTime,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.YES
		);
		this.dashboardHelperService.changeAmountDataUpToTwoDecimal(currentDayNewSubsAmountData);
		const currentDayOldSubsAmountData = await this.dashboardDaoService.getWeeklySubscriptionAmountData(
			startDate,
			endDateWithTime,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.NO
		);
		this.dashboardHelperService.changeAmountDataUpToTwoDecimal(currentDayOldSubsAmountData);
		const currentDayUsersData = await this.dashboardDaoService.getWeeklyUsersRegistered(startDate, endDateWithTime);
		const currentDayRefdocUploadData = await this.dashboardDaoService.getWeeklyRefdocUploadData(
			startDate,
			endDateWithTime
		);
		const currentDayRefdocVerifiedData = await this.dashboardDaoService.getWeeklyRefdocVerifiedData(
			startDate,
			endDateWithTime
		);
		const currentDayDisputeRaised = await this.dashboardDaoService.getWeeklyDisputeRaisedData(
			startDate,
			endDateWithTime
		);
		const currentDayDisputeClosed = await this.dashboardDaoService.getWeeklyDisputeClosedData(
			startDate,
			endDateWithTime
		);
		let weeklyDashboardData: DashboardWeeklyData;
		weeklyDashboardData = new DashboardWeeklyData();
		if (currentDayNewSubsData?.[0]?.value) {
			weeklyDashboardData.newSubscriptions = currentDayNewSubsData[0].value;
		}

		if (currentDayOldSubsData?.[0]?.value) {
			weeklyDashboardData.recurringSubscriptions = currentDayOldSubsData[0].value;
		}

		if (currentDayNewSubsAmountData?.[0]?.value) {
			weeklyDashboardData.newSubscriptionsAmount = currentDayNewSubsAmountData[0].value.toString();
		}

		if (currentDayOldSubsAmountData?.[0]?.value) {
			weeklyDashboardData.recurringSubscriptionsAmount = currentDayOldSubsAmountData[0].value.toString();
		}

		if (currentDayRefdocUploadData?.[0]?.value) {
			weeklyDashboardData.refdocUploads = currentDayRefdocUploadData[0].value;
		}

		if (currentDayUsersData?.[0]?.value) {
			weeklyDashboardData.registeredUsers = currentDayUsersData[0].value;
		}

		if (currentDayRefdocVerifiedData?.[0]?.value) {
			weeklyDashboardData.verifiedRefdoc = currentDayRefdocVerifiedData[0].value;
		}

		if (currentDayDisputeRaised?.[0]?.value) {
			weeklyDashboardData.disputesRaised = currentDayDisputeRaised[0].value;
		}

		if (currentDayDisputeClosed?.[0]?.value) {
			weeklyDashboardData.disputesClosed = currentDayDisputeClosed[0].value;
		}
		const isWeeklyData = await this.dashboardHelperService.checkForNullvalues(weeklyDashboardData);
		if (!isWeeklyData) {
			weeklyDashboardData.date = startDate;
			await this.mongoDaoService.saveMongoDashboardWeeklyData([weeklyDashboardData]);
		}

		const monthName = MonthMapEnum[(startDate.getMonth() + 1).toString()];
		let monthlyDashboardData: DashboardMonthlyData;
		monthlyDashboardData = await this.mongoDaoService.getMongoDashboardMonthlyData(monthName);
		if (monthlyDashboardData) {
			if (currentDayNewSubsData?.[0]?.value) {
				monthlyDashboardData.newSubscriptions = (
					(+monthlyDashboardData.newSubscriptions || 0) + +currentDayNewSubsData[0].value
				).toString();
			}

			if (currentDayOldSubsData?.[0]?.value) {
				monthlyDashboardData.recurringSubscriptions = (
					(+monthlyDashboardData.recurringSubscriptions || 0) + +currentDayOldSubsData[0].value
				).toString();
			}

			if (currentDayNewSubsAmountData?.[0]?.value) {
				const newSubscriptionsAmount =
					(+monthlyDashboardData.newSubscriptionsAmount || 0) + +currentDayNewSubsAmountData[0].value;
				monthlyDashboardData.newSubscriptionsAmount = parseFloat(newSubscriptionsAmount.toFixed(2)).toString();
			}

			if (currentDayOldSubsAmountData?.[0]?.value) {
				const recurringSubscriptionsAmount =
					(+monthlyDashboardData.recurringSubscriptionsAmount || 0) + +currentDayOldSubsAmountData[0].value;
				monthlyDashboardData.recurringSubscriptionsAmount = parseFloat(
					recurringSubscriptionsAmount.toFixed(2)
				).toString();
			}

			if (currentDayRefdocUploadData?.[0]?.value) {
				monthlyDashboardData.refdocUploads = (
					(+monthlyDashboardData.refdocUploads || 0) + +currentDayRefdocUploadData[0].value
				).toString();
			}

			if (currentDayUsersData?.[0]?.value) {
				monthlyDashboardData.registeredUsers = (
					(+monthlyDashboardData.registeredUsers || 0) + +currentDayUsersData[0].value
				).toString();
			}

			if (currentDayRefdocVerifiedData?.[0]?.value) {
				monthlyDashboardData.verifiedRefdoc = (
					(+monthlyDashboardData.verifiedRefdoc || 0) + +currentDayRefdocVerifiedData[0].value
				).toString();
			}

			if (currentDayDisputeClosed?.[0]?.value) {
				monthlyDashboardData.disputesClosed = (
					(+monthlyDashboardData.disputesClosed || 0) + +currentDayDisputeClosed[0].value
				).toString();
			}

			if (currentDayDisputeRaised?.[0]?.value) {
				monthlyDashboardData.disputesRaised = (
					(+monthlyDashboardData.disputesRaised || 0) + +currentDayDisputeRaised[0].value
				).toString();
			}
			await this.mongoDaoService.saveMongoDashboardMonthlyData([monthlyDashboardData]);
		} else {
			monthlyDashboardData = new DashboardMonthlyData();
			if (currentDayNewSubsData?.[0]?.value) {
				monthlyDashboardData.newSubscriptions = currentDayNewSubsData[0].value;
			}

			if (currentDayOldSubsData?.[0]?.value) {
				monthlyDashboardData.recurringSubscriptions = currentDayOldSubsData[0].value;
			}

			if (currentDayNewSubsAmountData?.[0]?.value) {
				monthlyDashboardData.newSubscriptionsAmount = currentDayNewSubsAmountData[0].value.toString();
			}

			if (currentDayOldSubsAmountData?.[0]?.value) {
				monthlyDashboardData.recurringSubscriptionsAmount = currentDayOldSubsAmountData[0].value.toString();
			}

			if (currentDayRefdocUploadData?.[0]?.value) {
				monthlyDashboardData.refdocUploads = currentDayRefdocUploadData[0].value;
			}

			if (currentDayUsersData?.[0]?.value) {
				monthlyDashboardData.registeredUsers = currentDayUsersData[0].value;
			}

			if (currentDayRefdocVerifiedData?.[0]?.value) {
				monthlyDashboardData.verifiedRefdoc = currentDayRefdocVerifiedData[0].value;
			}

			if (currentDayDisputeRaised?.[0]?.value) {
				monthlyDashboardData.disputesRaised = currentDayDisputeRaised[0].value;
			}

			if (currentDayDisputeClosed?.[0]?.value) {
				monthlyDashboardData.disputesClosed = currentDayDisputeClosed[0].value;
			}
			const isMonthlyDataNull = this.dashboardHelperService.checkForNullvalues(monthlyDashboardData);
			if (!isMonthlyDataNull) {
				monthlyDashboardData.month = monthName;
				await this.mongoDaoService.saveMongoDashboardMonthlyData([monthlyDashboardData]);
			}
		}

		const sundayDate = this.dashboardHelperService.getSundayDate(startDate);
		const weekStartDate = new Date(sundayDate.getFullYear(), sundayDate.getMonth(), sundayDate.getDate() - 6);
		let eightWeeksDashboardData: DashboardEightWeeksData;
		eightWeeksDashboardData = await this.mongoDaoService.getMongoDashboardEightWeeksData(weekStartDate);
		if (eightWeeksDashboardData) {
			if (currentDayNewSubsData?.[0]?.value) {
				eightWeeksDashboardData.newSubscriptions = (
					(+eightWeeksDashboardData.newSubscriptions || 0) + +currentDayNewSubsData[0].value
				).toString();
			}

			if (currentDayOldSubsData?.[0]?.value) {
				eightWeeksDashboardData.recurringSubscriptions = (
					(+eightWeeksDashboardData.recurringSubscriptions || 0) + +currentDayOldSubsData[0].value
				).toString();
			}

			if (currentDayNewSubsAmountData?.[0]?.value) {
				const newSubscriptionsAmount =
					(+eightWeeksDashboardData.newSubscriptionsAmount || 0) + +currentDayNewSubsAmountData[0].value;
				monthlyDashboardData.newSubscriptionsAmount = parseFloat(newSubscriptionsAmount.toFixed(2)).toString();
			}

			if (currentDayOldSubsAmountData?.[0]?.value) {
				const recurringSubscriptionsAmount =
					(+eightWeeksDashboardData.recurringSubscriptionsAmount || 0) + +currentDayOldSubsAmountData[0].value;
				monthlyDashboardData.recurringSubscriptionsAmount = parseFloat(
					recurringSubscriptionsAmount.toFixed(2)
				).toString();
			}

			if (currentDayRefdocUploadData?.[0]?.value) {
				eightWeeksDashboardData.refdocUploads = (
					(+eightWeeksDashboardData.refdocUploads || 0) + +currentDayRefdocUploadData[0].value
				).toString();
			}

			if (currentDayUsersData?.[0]?.value) {
				eightWeeksDashboardData.registeredUsers = (
					(+eightWeeksDashboardData.registeredUsers || 0) + +currentDayUsersData[0].value
				).toString();
			}

			if (currentDayRefdocVerifiedData?.[0]?.value) {
				eightWeeksDashboardData.verifiedRefdoc = (
					(+eightWeeksDashboardData.verifiedRefdoc || 0) + +currentDayRefdocVerifiedData[0].value
				).toString();
			}

			if (currentDayDisputeClosed?.[0]?.value) {
				eightWeeksDashboardData.disputesClosed = (
					(+eightWeeksDashboardData.disputesClosed || 0) + +currentDayDisputeClosed[0].value
				).toString();
			}

			if (currentDayDisputeRaised?.[0]?.value) {
				eightWeeksDashboardData.disputesRaised = (
					(+eightWeeksDashboardData.disputesRaised || 0) + +currentDayDisputeRaised[0].value
				).toString();
			}
			await this.mongoDaoService.saveMongoDashboardEightWeeksData([eightWeeksDashboardData]);
		} else {
			eightWeeksDashboardData = new DashboardEightWeeksData();
			if (currentDayNewSubsData?.[0]?.value) {
				eightWeeksDashboardData.newSubscriptions = currentDayNewSubsData[0].value;
			}

			if (currentDayOldSubsData?.[0]?.value) {
				eightWeeksDashboardData.recurringSubscriptions = currentDayOldSubsData[0].value;
			}

			if (currentDayNewSubsAmountData?.[0]?.value) {
				eightWeeksDashboardData.newSubscriptionsAmount = currentDayNewSubsAmountData[0].value.toString();
			}

			if (currentDayOldSubsAmountData?.[0]?.value) {
				eightWeeksDashboardData.recurringSubscriptionsAmount = currentDayOldSubsAmountData[0].value.toString();
			}

			if (currentDayRefdocUploadData?.[0]?.value) {
				eightWeeksDashboardData.refdocUploads = currentDayRefdocUploadData[0].value;
			}

			if (currentDayUsersData?.[0]?.value) {
				eightWeeksDashboardData.registeredUsers = currentDayUsersData[0].value;
			}

			if (currentDayRefdocVerifiedData?.[0]?.value) {
				eightWeeksDashboardData.verifiedRefdoc = currentDayRefdocVerifiedData[0].value;
			}

			if (currentDayDisputeRaised?.[0]?.value) {
				eightWeeksDashboardData.disputesRaised = currentDayDisputeRaised[0].value;
			}

			if (currentDayDisputeClosed?.[0]?.value) {
				eightWeeksDashboardData.disputesClosed = currentDayDisputeClosed[0].value;
			}
			const isEightWeeksDataNull = this.dashboardHelperService.checkForNullvalues(eightWeeksDashboardData);
			if (!isEightWeeksDataNull) {
				eightWeeksDashboardData.weekStartDate = weekStartDate;
				await this.mongoDaoService.saveMongoDashboardEightWeeksData([eightWeeksDashboardData]);
			}
		}
	}

	@Cron(`${process.env.UPDATE_CURRENT_DAY_DASHBOARD_DATA_EXPRESSION}`)
	async updateDashboard() {
		let flag = await this.schedularHelperService.checkAndUpdateSchedulerRunningStatus(
			"UPDATE_CURRENT_DAY_DASHBOARD_DATA_EXPRESSION"
		);
		if (!flag) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.INFO,
				"Scheduler Already Running - UPDATE_CURRENT_DAY_DASHBOARD_DATA_EXPRESSION",
				"dashboard.module",
				"dashboard.service",
				"updateDashboard",
				null
			);
			this.appLoggerService.writeLog(appLoggerDto);
			return;
		}
		try {
			await this.updatePreviousDayDashboardData();
		} catch (err) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"UPDATE_CURRENT_DAY_DASHBOARD_DATA_EXPRESSION_ERROR",
				"dashboard.module",
				"dashboard.service",
				"updateDashboard",
				err
			);
			this.appLoggerService.writeLog(appLoggerDto);
		}
		await this.schedularHelperService.updateSchedulerRunningStatus("UPDATE_CURRENT_DAY_DASHBOARD_DATA_EXPRESSION", 0);
	}
}
