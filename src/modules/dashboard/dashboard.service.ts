import { DashboardDaoService } from "@modules/dao/dashboard-dao/dashboard-dao.service";
import { Injectable } from "@nestjs/common";
import { PaymentStatusEnum, YesNoEnum } from "@utils/enums/Status";
import { DashboardHelperService } from "./dashboard-helper/dashboard-helper.service";
import { DocumentTypeEnum } from "@utils/enums/constants";
import { MonthlyProofTypeEnum } from "@utils/enums/txn-types";
import { MongoDaoService } from "@modules/dao/mongo-dao/mongo-dao.service";
import { DashboardWeeklyData } from "@modules/mongo/entities/dashboardWeeklyDataEntity";
import { DashboardMonthlyData } from "@modules/mongo/entities/dashboardMonthlyDataEntity";
import { MonthMapEnum } from "@utils/constants/map-month-constants";
import { DashboardEightWeeksData } from "@modules/mongo/entities/dashboardEightWeeksDataEntity";

@Injectable()
export class DashboardService {
	constructor(
		private readonly dashboardDaoService: DashboardDaoService,
		private readonly dashboardHelperService: DashboardHelperService,
		private readonly mongoDaoService: MongoDaoService
	) {}

	async updateWeeklyDashboardData() {
		const endDate = new Date();
		endDate.setHours(0);
		endDate.setMinutes(0);
		endDate.setSeconds(0);
		endDate.setMilliseconds(0);
		let weekStartDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 7);
		const weeklyNewSubsData = await this.dashboardDaoService.getWeeklySubscriptionData(
			weekStartDate,
			endDate,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.YES
		);
		const weeklyOldSubsData = await this.dashboardDaoService.getWeeklySubscriptionData(
			weekStartDate,
			endDate,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.NO
		);

		const weeklyNewSubsAmountData = await this.dashboardDaoService.getWeeklySubscriptionAmountData(
			weekStartDate,
			endDate,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.YES
		);
		this.dashboardHelperService.changeAmountDataUpToTwoDecimal(weeklyNewSubsAmountData);
		const weeklyOldSubsAmountData = await this.dashboardDaoService.getWeeklySubscriptionAmountData(
			weekStartDate,
			endDate,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.NO
		);
		this.dashboardHelperService.changeAmountDataUpToTwoDecimal(weeklyOldSubsAmountData);

		const weeklyUsersData = await this.dashboardDaoService.getWeeklyUsersRegistered(weekStartDate, endDate);
		const weeklyRefdocUploadData = await this.dashboardDaoService.getWeeklyRefdocUploadData(weekStartDate, endDate);
		const weeklyRefdocVerifiedData = await this.dashboardDaoService.getWeeklyRefdocVerifiedData(weekStartDate, endDate);
		const weeklyDisputeRaised = await this.dashboardDaoService.getWeeklyDisputeRaisedData(weekStartDate, endDate);
		const weeklyDisputeClosed = await this.dashboardDaoService.getWeeklyDisputeClosedData(weekStartDate, endDate);
		const weeklyDashboardDataArr = [];
		weekStartDate.setMilliseconds(0);
		while (endDate?.getTime() > weekStartDate?.getTime()) {
			let weeklyDashboardData: DashboardWeeklyData;
			weeklyDashboardData = new DashboardWeeklyData();
			weeklyNewSubsData.forEach((data) => {
				if (weekStartDate?.getTime() === new Date(data["day"])?.getTime()) {
					weeklyDashboardData.newSubscriptions = data["value"];
				}
			});

			weeklyOldSubsData.forEach((data) => {
				if (weekStartDate?.getTime() === new Date(data["day"])?.getTime()) {
					weeklyDashboardData.recurringSubscriptions = data["value"];
				}
			});

			weeklyNewSubsAmountData.forEach((data) => {
				if (weekStartDate?.getTime() === new Date(data["day"])?.getTime()) {
					weeklyDashboardData.newSubscriptionsAmount = data["value"].toString();
				}
			});

			weeklyOldSubsAmountData.forEach((data) => {
				if (weekStartDate?.getTime() === new Date(data["day"])?.getTime()) {
					weeklyDashboardData.recurringSubscriptionsAmount = data["value"].toString();
				}
			});

			weeklyUsersData.forEach((data) => {
				if (weekStartDate?.getTime() === new Date(data["day"])?.getTime()) {
					weeklyDashboardData.registeredUsers = data["value"];
				}
			});

			weeklyRefdocUploadData.forEach((data) => {
				if (weekStartDate?.getTime() === new Date(data["day"])?.getTime()) {
					weeklyDashboardData.refdocUploads = data["value"];
				}
			});

			weeklyRefdocVerifiedData.forEach((data) => {
				if (weekStartDate?.getTime() === new Date(data["day"])?.getTime()) {
					weeklyDashboardData.verifiedRefdoc = data["value"];
				}
			});

			weeklyDisputeRaised.forEach((data) => {
				if (weekStartDate?.getTime() === new Date(data["day"])?.getTime()) {
					weeklyDashboardData.disputesRaised = data["value"];
				}
			});

			weeklyDisputeClosed.forEach((data) => {
				if (weekStartDate?.getTime() === new Date(data["day"])?.getTime()) {
					weeklyDashboardData.disputesClosed = data["value"];
				}
			});

			const isDashDataNull = this.dashboardHelperService.checkForNullvalues(weeklyDashboardData);
			if (!isDashDataNull) {
				weeklyDashboardData.date = weekStartDate;
				weeklyDashboardDataArr.push(weeklyDashboardData);
			}
			weekStartDate = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate() + 1);
		}

		await this.mongoDaoService.saveMongoDashboardWeeklyData(weeklyDashboardDataArr);
	}

	async updateEightWeeksDashboardData() {
		const endDate = new Date();
		endDate.setHours(0);
		endDate.setMinutes(0);
		endDate.setSeconds(0);
		endDate.setMilliseconds(0);
		const eightWeeksEndDate = this.dashboardHelperService.getSundayDate(endDate);
		let eightWeeksStartDate = new Date(eightWeeksEndDate);
		eightWeeksStartDate.setDate(eightWeeksEndDate.getDate() - 55);
		eightWeeksStartDate.setHours(0);
		eightWeeksStartDate.setMinutes(0);
		eightWeeksStartDate.setSeconds(0);

		const eightWeeksNewSubsData = await this.dashboardHelperService.fetchDataForEightWeeks(
			eightWeeksStartDate,
			endDate,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.YES
		);

		const eightWeeksOldSubsData = await this.dashboardHelperService.fetchDataForEightWeeks(
			eightWeeksStartDate,
			endDate,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.NO
		);

		const eightWeeksNewSubsAmountData = await this.dashboardHelperService.fetchDataForEightWeeks(
			eightWeeksStartDate,
			endDate,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.YES,
			"SubscriptionAmount"
		);
		this.dashboardHelperService.changeAmountDataUpToTwoDecimal(eightWeeksNewSubsAmountData);
		const eightWeeksOldSubsAmountData = await this.dashboardHelperService.fetchDataForEightWeeks(
			eightWeeksStartDate,
			endDate,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.NO,
			"SubscriptionAmount"
		);
		this.dashboardHelperService.changeAmountDataUpToTwoDecimal(eightWeeksOldSubsAmountData);

		const eightWeeksUsersData = await this.dashboardHelperService.fetchUserRegistersDataForEightWeeks(
			eightWeeksStartDate,
			endDate
		);
		const eightWeeksRefdocUploadData = await this.dashboardHelperService.fetchRefdocUploadsDataForEightWeeks(
			eightWeeksStartDate,
			endDate
		);
		const eightWeeksRefdocVerifiedData = await this.dashboardHelperService.fetchRefdocVerifiedDataForEightWeeks(
			eightWeeksStartDate,
			endDate
		);
		const eightWeeksDisputeRaised = await this.dashboardHelperService.fetchDisputeDataForEightWeeks(
			eightWeeksStartDate,
			endDate,
			"RaisedDisputes"
		);
		const eightWeeksDisputeClosed = await this.dashboardHelperService.fetchDisputeDataForEightWeeks(
			eightWeeksStartDate,
			endDate
		);
		const eightWeeksDashboardDataArr = [];
		eightWeeksStartDate.setMilliseconds(0);
		while (endDate?.getTime() > eightWeeksStartDate?.getTime()) {
			let eightWeeksDashboardData: DashboardEightWeeksData;
			eightWeeksDashboardData = new DashboardEightWeeksData();
			eightWeeksNewSubsData.forEach((data) => {
				if (eightWeeksStartDate?.getTime() === new Date(data["weekStartDate"])?.getTime()) {
					eightWeeksDashboardData.newSubscriptions = data["weekData"];
				}
			});

			eightWeeksOldSubsData.forEach((data) => {
				if (eightWeeksStartDate?.getTime() === new Date(data["weekStartDate"])?.getTime()) {
					eightWeeksDashboardData.recurringSubscriptions = data["weekData"];
				}
			});

			eightWeeksNewSubsAmountData.forEach((data) => {
				if (eightWeeksStartDate?.getTime() === new Date(data["weekStartDate"])?.getTime()) {
					eightWeeksDashboardData.newSubscriptionsAmount = data["weekData"].toString();
				}
			});

			eightWeeksOldSubsAmountData.forEach((data) => {
				if (eightWeeksStartDate?.getTime() === new Date(data["weekStartDate"])?.getTime()) {
					eightWeeksDashboardData.recurringSubscriptionsAmount = data["weekData"].toString();
				}
			});

			eightWeeksUsersData.forEach((data) => {
				if (eightWeeksStartDate?.getTime() === new Date(data["weekStartDate"])?.getTime()) {
					eightWeeksDashboardData.registeredUsers = data["weekData"];
				}
			});

			eightWeeksRefdocUploadData.forEach((data) => {
				if (eightWeeksStartDate?.getTime() === new Date(data["weekStartDate"])?.getTime()) {
					eightWeeksDashboardData.refdocUploads = data["weekData"];
				}
			});

			eightWeeksRefdocVerifiedData.forEach((data) => {
				if (eightWeeksStartDate?.getTime() === new Date(data["weekStartDate"])?.getTime()) {
					eightWeeksDashboardData.verifiedRefdoc = data["weekData"];
				}
			});

			eightWeeksDisputeRaised.forEach((data) => {
				if (eightWeeksStartDate?.getTime() === new Date(data["weekStartDate"])?.getTime()) {
					eightWeeksDashboardData.disputesRaised = data["weekData"];
				}
			});

			eightWeeksDisputeClosed.forEach((data) => {
				if (eightWeeksStartDate?.getTime() === new Date(data["weekStartDate"])?.getTime()) {
					eightWeeksDashboardData.disputesClosed = data["weekData"];
				}
			});

			const isDashDataNull = this.dashboardHelperService.checkForNullvalues(eightWeeksDashboardData);
			if (!isDashDataNull) {
				eightWeeksDashboardData.weekStartDate = eightWeeksStartDate;
				eightWeeksDashboardDataArr.push(eightWeeksDashboardData);
			}
			eightWeeksStartDate = new Date(
				eightWeeksStartDate.getFullYear(),
				eightWeeksStartDate.getMonth(),
				eightWeeksStartDate.getDate() + 7
			);
		}

		await this.mongoDaoService.saveMongoDashboardEightWeeksData(eightWeeksDashboardDataArr);
	}

	async updateMonthlyDashboardData() {
		let endDate = new Date();
		endDate.setHours(0);
		endDate.setMinutes(0);
		endDate.setSeconds(0);
		endDate.setMilliseconds(0);
		let monthStartDate = new Date(endDate.getFullYear(), endDate.getMonth() - 7, 1);

		const monthlyNewSubsData = await this.dashboardDaoService.getMonthlySubscriptionData(
			monthStartDate,
			endDate,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.YES
		);
		const monthlyOldSubsData = await this.dashboardDaoService.getMonthlySubscriptionData(
			monthStartDate,
			endDate,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.NO
		);
		const monthlyNewSubsAmountData = await this.dashboardDaoService.getMonthlySubscriptionAmountData(
			monthStartDate,
			endDate,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.YES
		);
		this.dashboardHelperService.changeAmountDataUpToTwoDecimal(monthlyNewSubsAmountData);
		const monthlyOldSubsAmountData = await this.dashboardDaoService.getMonthlySubscriptionAmountData(
			monthStartDate,
			endDate,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.NO
		);
		this.dashboardHelperService.changeAmountDataUpToTwoDecimal(monthlyOldSubsAmountData);
		const monthlyUsersData = await this.dashboardDaoService.getMonthlyUsersRegistererd(monthStartDate, endDate);
		const monthlyRefdocUploadData = await this.dashboardDaoService.getMonthlyRefdocUploadData(monthStartDate, endDate);
		const monthlyRefdocVerifiedData = await this.dashboardDaoService.getMonthlyRefdocVerifiedData(
			monthStartDate,
			endDate
		);
		const monthlyDisputeRaised = await this.dashboardDaoService.getMonthlyDisputeRaisedData(monthStartDate, endDate);
		const monthlyDisputeClosed = await this.dashboardDaoService.getMonthlyDisputeClosedData(monthStartDate, endDate);

		const monthlyDashboardDataArr = [];
		monthStartDate.setMilliseconds(0);
		while (endDate?.getTime() > monthStartDate?.getTime()) {
			let monthlyDashboardData: DashboardMonthlyData;
			monthlyDashboardData = new DashboardMonthlyData();
			const monthName = MonthMapEnum[(monthStartDate.getMonth() + 1).toString()];
			monthlyNewSubsData.forEach((data) => {
				if (monthName === data["month"].slice(0, 3)) {
					monthlyDashboardData.newSubscriptions = data["value"];
				}
			});

			monthlyOldSubsData.forEach((data) => {
				if (monthName === data["month"].slice(0, 3)) {
					monthlyDashboardData.recurringSubscriptions = data["value"];
				}
			});

			monthlyNewSubsAmountData.forEach((data) => {
				if (monthName === data["month"].slice(0, 3)) {
					monthlyDashboardData.newSubscriptionsAmount = data["value"].toString();
				}
			});

			monthlyOldSubsAmountData.forEach((data) => {
				if (monthName === data["month"].slice(0, 3)) {
					monthlyDashboardData.recurringSubscriptionsAmount = data["value"].toString();
				}
			});

			monthlyUsersData.forEach((data) => {
				if (monthName === data["month"].slice(0, 3)) {
					monthlyDashboardData.registeredUsers = data["value"];
				}
			});

			monthlyRefdocUploadData.forEach((data) => {
				if (monthName === data["month"].slice(0, 3)) {
					monthlyDashboardData.refdocUploads = data["value"];
				}
			});

			monthlyRefdocVerifiedData.forEach((data) => {
				if (monthName === data["month"].slice(0, 3)) {
					monthlyDashboardData.verifiedRefdoc = data["value"];
				}
			});

			monthlyDisputeRaised.forEach((data) => {
				if (monthName === data["month"].slice(0, 3)) {
					monthlyDashboardData.disputesRaised = data["value"];
				}
			});

			monthlyDisputeClosed.forEach((data) => {
				if (monthName === data["month"].slice(0, 3)) {
					monthlyDashboardData.disputesClosed = data["value"];
				}
			});

			const isDashDataNull = this.dashboardHelperService.checkForNullvalues(monthlyDashboardData);
			if (!isDashDataNull) {
				monthlyDashboardData.month = monthName;
				monthlyDashboardDataArr.push(monthlyDashboardData);
			}
			monthStartDate = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, monthStartDate.getDate());
		}
		await this.mongoDaoService.saveMongoDashboardMonthlyData(monthlyDashboardDataArr);
	}

	async getSubscriptionDataMongo() {
		const { weeklyData, monthlyData, eightWeeksData } = await this.dashboardHelperService.getSnapshotGraphsDataMongo(
			"SubscriptionData"
		);
		const subscriptionData = {};
		subscriptionData["weeklyData"] = weeklyData;
		subscriptionData["monthlyData"] = monthlyData;
		subscriptionData["eightWeeksData"] = eightWeeksData;
		return subscriptionData;
	}

	async getSubscriptionAmountCollectedDataMongo() {
		let {
			endDate,
			weekStartDate,
			newWeekStartDate,
			monthStartDate,
			newMonthStartDate,
			eightWeeksEndDate,
			eightWeeksStartDate
		} = this.dashboardHelperService.createDatesForDashboardDataFetch();
		const weeklyNewSubsAmountData = [];
		const weeklyOldSubsAmountData = [];
		weekStartDate.setMilliseconds(0);
		while (endDate?.getTime() > weekStartDate?.getTime()) {
			const dashboardData = await this.mongoDaoService.getMongoDashboardWeeklyData(weekStartDate);
			if (dashboardData?.newSubscriptionsAmount) {
				const newSubsAmountDataObj = {};
				newSubsAmountDataObj["day"] = dashboardData.date;
				newSubsAmountDataObj["value"] = dashboardData.newSubscriptionsAmount;
				weeklyNewSubsAmountData.push(newSubsAmountDataObj);
			}
			if (dashboardData?.recurringSubscriptionsAmount) {
				const oldSubsAmountDataObj = {};
				oldSubsAmountDataObj["day"] = dashboardData.date;
				oldSubsAmountDataObj["value"] = dashboardData.recurringSubscriptionsAmount;
				weeklyOldSubsAmountData.push(oldSubsAmountDataObj);
			}
			weekStartDate = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate() + 1);
		}

		const monthlyNewSubsAmountData = [];
		const monthlyOldSubsAmountData = [];
		const currentMonthName = MonthMapEnum[(endDate.getMonth() + 1).toString()];
		monthStartDate.setMilliseconds(0);
		while (endDate?.getTime() > monthStartDate?.getTime()) {
			const monthName = MonthMapEnum[(monthStartDate.getMonth() + 1).toString()];
			const dashboardData = await this.mongoDaoService.getMongoDashboardMonthlyData(monthName);
			if (dashboardData?.newSubscriptionsAmount) {
				const newSubsDataAmountObj = {};
				newSubsDataAmountObj["month"] = dashboardData.month;
				newSubsDataAmountObj["value"] = dashboardData.newSubscriptionsAmount;
				monthlyNewSubsAmountData.push(newSubsDataAmountObj);
			}
			if (dashboardData?.recurringSubscriptionsAmount) {
				const oldSubsDataAmountObj = {};
				oldSubsDataAmountObj["month"] = dashboardData.month;
				oldSubsDataAmountObj["value"] = dashboardData.recurringSubscriptionsAmount;
				monthlyOldSubsAmountData.push(oldSubsDataAmountObj);
			}
			monthStartDate = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, monthStartDate.getDate());
		}

		const eightWeeksNewSubsAmountData = [];
		const eightWeeksOldSubsAmountData = [];
		eightWeeksStartDate.setMilliseconds(0);
		while (eightWeeksEndDate?.getTime() > eightWeeksStartDate?.getTime()) {
			const dashboardData = await this.mongoDaoService.getMongoDashboardEightWeeksData(eightWeeksStartDate);
			if (dashboardData?.newSubscriptionsAmount) {
				const newSubsAmountDataObj = {};
				newSubsAmountDataObj["weekStartDate"] = dashboardData.weekStartDate;
				newSubsAmountDataObj["weekData"] = dashboardData.newSubscriptionsAmount;
				eightWeeksNewSubsAmountData.push(newSubsAmountDataObj);
			}
			if (dashboardData?.recurringSubscriptionsAmount) {
				const oldSubsAmountDataObj = {};
				oldSubsAmountDataObj["weekStartDate"] = dashboardData.weekStartDate;
				oldSubsAmountDataObj["weekData"] = dashboardData.recurringSubscriptionsAmount;
				eightWeeksOldSubsAmountData.push(oldSubsAmountDataObj);
			}
			eightWeeksStartDate.setDate(eightWeeksStartDate.getDate() + 7);
		}
		const endDateWithTime = new Date();
		const currentDayNewSubsAmountData = await this.dashboardDaoService.getWeeklySubscriptionAmountData(
			endDate,
			endDateWithTime,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.YES
		);
		this.dashboardHelperService.changeAmountDataUpToTwoDecimal(currentDayNewSubsAmountData);
		if (currentDayNewSubsAmountData.length) {
			weeklyNewSubsAmountData.push(currentDayNewSubsAmountData[0]);
			let currentMonthDataAdded = false;
			monthlyNewSubsAmountData.forEach((data) => {
				if (data["month"] === currentMonthName) {
					data["value"] = (+data["value"] + +currentDayNewSubsAmountData[0]["value"]).toString();
					currentMonthDataAdded = true;
				}
			});
			if (!currentMonthDataAdded) {
				const newSubsDataAmountObj = {};
				newSubsDataAmountObj["month"] = currentMonthName;
				newSubsDataAmountObj["value"] = currentDayNewSubsAmountData[0]["value"].toString();
				monthlyNewSubsAmountData.push(newSubsDataAmountObj);
			}
			let currentWeekDataAdded = false;
			eightWeeksNewSubsAmountData.forEach((data) => {
				if (data["weekStartDate"]?.getTime() === eightWeeksStartDate?.getTime()) {
					data["weekData"] = (+data["weekData"] + +currentDayNewSubsAmountData[0]["value"]).toString();
					currentWeekDataAdded = true;
				}
			});
			if (!currentWeekDataAdded) {
				const newSubsAmountDataObj = {};
				newSubsAmountDataObj["weekStartDate"] = eightWeeksStartDate;
				newSubsAmountDataObj["weekData"] = currentDayNewSubsAmountData[0]["value"].toString();
				eightWeeksNewSubsAmountData.push(newSubsAmountDataObj);
			}
		}
		const currentDayOldSubsAmountData = await this.dashboardDaoService.getWeeklySubscriptionAmountData(
			endDate,
			endDateWithTime,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.NO
		);
		if (currentDayOldSubsAmountData.length) {
			weeklyOldSubsAmountData.push(currentDayOldSubsAmountData[0]);
			let currentMonthDataAdded = false;
			monthlyOldSubsAmountData.forEach((data) => {
				if (data["month"] === currentMonthName) {
					data["value"] = (+data["value"] + +currentDayOldSubsAmountData[0]["value"]).toString();
					currentMonthDataAdded = true;
				}
			});
			if (!currentMonthDataAdded) {
				const oldSubsDataObj = {};
				oldSubsDataObj["month"] = currentMonthName;
				oldSubsDataObj["value"] = currentDayOldSubsAmountData[0]["value"].toString();
				monthlyOldSubsAmountData.push(oldSubsDataObj);
			}
			let currentWeekDataAdded = false;
			eightWeeksOldSubsAmountData.forEach((data) => {
				if (data["weekStartDate"]?.getTime() === eightWeeksStartDate?.getTime()) {
					data["weekData"] = (+data["weekData"] + +currentDayOldSubsAmountData[0]["value"]).toString();
					currentWeekDataAdded = true;
				}
			});
			if (!currentWeekDataAdded) {
				const oldSubsDataObj = {};
				oldSubsDataObj["weekStartDate"] = eightWeeksStartDate;
				oldSubsDataObj["weekData"] = currentDayOldSubsAmountData[0]["value"].toString();
				eightWeeksOldSubsAmountData.push(oldSubsDataObj);
			}
		}

		const weeklyDataObj = {};
		weeklyDataObj["New Subscriptions Amount"] = weeklyNewSubsAmountData;
		weeklyDataObj["Recurring Subscriptions Amount"] = weeklyOldSubsAmountData;
		const arrangedSubsAmountWeeklyData = this.dashboardHelperService.arrangeMultipleWeeklyData(
			newWeekStartDate,
			endDate,
			weeklyDataObj
		);

		const monthlyDataObj = {};
		monthlyDataObj["New Subscriptions Amount"] = monthlyNewSubsAmountData;
		monthlyDataObj["Recurring Subscriptions Amount"] = monthlyOldSubsAmountData;
		const arrangedSubsAmountMonthlyData = this.dashboardHelperService.arrangeMultipleMonthlyData(
			newMonthStartDate,
			endDate,
			monthlyDataObj
		);

		const eightWeeksDataObj = {};
		eightWeeksDataObj["New Subscriptions Amount"] = eightWeeksNewSubsAmountData;
		eightWeeksDataObj["Recurring Subscriptions Amount"] = eightWeeksOldSubsAmountData;
		const arrangedSubsAmountEightWeeksData = this.dashboardHelperService.arrangeEightWeeksData(eightWeeksDataObj);
		const subscriptionAmountData = {};
		subscriptionAmountData["weeklyData"] = arrangedSubsAmountWeeklyData;
		subscriptionAmountData["monthlyData"] = arrangedSubsAmountMonthlyData;
		subscriptionAmountData["eightWeeksData"] = arrangedSubsAmountEightWeeksData;
		return subscriptionAmountData;
	}

	async getSnapshotData() {
		const { weeklyData, monthlyData, eightWeeksData } = await this.dashboardHelperService.getSnapshotGraphsDataMongo(
			"Snapshot"
		);
		const snapshotData = {};
		snapshotData["weeklyData"] = weeklyData;
		snapshotData["monthlyData"] = monthlyData;
		snapshotData["eightWeeksData"] = eightWeeksData;
		return snapshotData;
	}

	async getSnapshotCumulativeData() {
		const { weeklyData, monthlyData, eightWeeksData } = await this.dashboardHelperService.getSnapshotGraphsDataMongo(
			"Snapshot"
		);
		this.dashboardHelperService.arrangeCumulativeData(weeklyData);
		this.dashboardHelperService.arrangeCumulativeData(monthlyData);
		this.dashboardHelperService.arrangeCumulativeData(eightWeeksData);
		const snapshotData = {};
		snapshotData["weeklyData"] = weeklyData;
		snapshotData["monthlyData"] = monthlyData;
		snapshotData["eightWeeksData"] = eightWeeksData;
		return snapshotData;
	}

	async getTotalReportingData() {
		const endDate = new Date();
		const weekStartDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 7);
		const monthStartDate = new Date(endDate.getFullYear(), endDate.getMonth() - 7, 1);
		const eightWeeksEndDate = this.dashboardHelperService.getSundayDate(endDate);
		const eightWeeksStartDate = new Date(eightWeeksEndDate);
		eightWeeksStartDate.setDate(eightWeeksEndDate.getDate() - 55);
		eightWeeksStartDate.setHours(0);
		eightWeeksStartDate.setMinutes(0);
		eightWeeksStartDate.setSeconds(0);

		const weeklyReportingData = [];
		const monthlyReportingData = [];
		const eightWeeksReportingData = await this.dashboardHelperService.fetchReportingDataForEightWeeks(
			eightWeeksStartDate,
			eightWeeksEndDate
		);
		const weeklyDataObj = {};
		weeklyDataObj["Total Reporting Done"] = weeklyReportingData;
		const arrangedWeeklyData = this.dashboardHelperService.arrangeMultipleWeeklyData(
			weekStartDate,
			endDate,
			weeklyDataObj
		);
		const monthlyDataObj = {};
		monthlyDataObj["Total Reporting Done"] = monthlyReportingData;
		const arrangedMonthlyData = this.dashboardHelperService.arrangeMultipleMonthlyData(
			monthStartDate,
			endDate,
			monthlyDataObj
		);
		const eightWeeksDataObj = {};
		eightWeeksDataObj["Total Reporting Done"] = eightWeeksReportingData;
		const arrangedEightWeeksData = this.dashboardHelperService.arrangeEightWeeksData(eightWeeksDataObj);
		const totalReportingData = {};
		totalReportingData["weeklyData"] = arrangedWeeklyData;
		totalReportingData["monthlyData"] = arrangedMonthlyData;
		totalReportingData["eightWeeksData"] = arrangedEightWeeksData;
		return totalReportingData;
	}

	async getDisputeChartDataMongo() {
		let {
			endDate,
			weekStartDate,
			newWeekStartDate,
			monthStartDate,
			newMonthStartDate,
			eightWeeksEndDate,
			eightWeeksStartDate
		} = this.dashboardHelperService.createDatesForDashboardDataFetch();
		const weeklyDisputesRaisedData = [];
		const weeklyDisputesClosedData = [];
		weekStartDate.setMilliseconds(0);
		while (endDate?.getTime() > weekStartDate?.getTime()) {
			const dashboardData = await this.mongoDaoService.getMongoDashboardWeeklyData(weekStartDate);
			if (dashboardData?.disputesRaised) {
				const disputesRaisedObj = {};
				disputesRaisedObj["day"] = dashboardData.date;
				disputesRaisedObj["value"] = dashboardData.disputesRaised;
				weeklyDisputesRaisedData.push(disputesRaisedObj);
			}
			if (dashboardData?.disputesClosed) {
				const disputesClosedObj = {};
				disputesClosedObj["day"] = dashboardData.date;
				disputesClosedObj["value"] = dashboardData.disputesClosed;
				weeklyDisputesClosedData.push(disputesClosedObj);
			}
			weekStartDate = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate() + 1);
		}

		const monthlyDisputesRaisedData = [];
		const monthlyDisputesClosedData = [];
		monthStartDate.setMilliseconds(0);
		while (endDate?.getTime() > monthStartDate?.getTime()) {
			const monthName = MonthMapEnum[(monthStartDate.getMonth() + 1).toString()];
			const dashboardData = await this.mongoDaoService.getMongoDashboardMonthlyData(monthName);
			if (dashboardData?.disputesRaised) {
				const disputesRaisedObj = {};
				disputesRaisedObj["month"] = dashboardData.month;
				disputesRaisedObj["value"] = dashboardData.disputesRaised;
				monthlyDisputesRaisedData.push(disputesRaisedObj);
			}
			if (dashboardData?.disputesClosed) {
				const disputesClosedObj = {};
				disputesClosedObj["month"] = dashboardData.month;
				disputesClosedObj["value"] = dashboardData.disputesClosed;
				monthlyDisputesClosedData.push(disputesClosedObj);
			}
			monthStartDate = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, monthStartDate.getDate());
		}

		const eightWeeksDisputesRaisedData = [];
		const eightWeeksDisputesClosedData = [];
		eightWeeksStartDate.setMilliseconds(0);
		while (eightWeeksEndDate?.getTime() > eightWeeksStartDate?.getTime()) {
			const dashboardData = await this.mongoDaoService.getMongoDashboardEightWeeksData(eightWeeksStartDate);
			if (dashboardData?.disputesRaised) {
				const disputesRaisedObj = {};
				disputesRaisedObj["weekStartDate"] = dashboardData.weekStartDate;
				disputesRaisedObj["weekData"] = dashboardData.disputesRaised;
				eightWeeksDisputesRaisedData.push(disputesRaisedObj);
			}
			if (dashboardData?.disputesClosed) {
				const disputesClosedObj = {};
				disputesClosedObj["weekStartDate"] = dashboardData.weekStartDate;
				disputesClosedObj["weekData"] = dashboardData.disputesClosed;
				eightWeeksDisputesClosedData.push(disputesClosedObj);
			}
			eightWeeksStartDate.setDate(eightWeeksStartDate.getDate() + 7);
		}

		const dateObj = { endDate, eightWeeksStartDate };
		this.dashboardHelperService.updatePreviousDayDisputeChartData(
			weeklyDisputesRaisedData,
			monthlyDisputesRaisedData,
			eightWeeksDisputesRaisedData,
			weeklyDisputesClosedData,
			monthlyDisputesClosedData,
			eightWeeksDisputesClosedData,
			dateObj
		);

		const weeklyDataObj = {};
		weeklyDataObj["Disputes Raised"] = weeklyDisputesRaisedData;
		weeklyDataObj["Disputes Closed"] = weeklyDisputesClosedData;
		const arrangedDisputesWeeklyData = this.dashboardHelperService.arrangeMultipleWeeklyData(
			newWeekStartDate,
			endDate,
			weeklyDataObj
		);

		const monthlyDataObj = {};
		monthlyDataObj["Disputes Raised"] = monthlyDisputesRaisedData;
		monthlyDataObj["Disputes Closed"] = monthlyDisputesClosedData;
		const arrangedDisputesMonthlyData = this.dashboardHelperService.arrangeMultipleMonthlyData(
			newMonthStartDate,
			endDate,
			monthlyDataObj
		);

		const eightWeeksDataObj = {};
		eightWeeksDataObj["Disputes Raised"] = eightWeeksDisputesRaisedData;
		eightWeeksDataObj["Disputes Closed"] = eightWeeksDisputesClosedData;
		const arrangedDisputesEightWeeksData = this.dashboardHelperService.arrangeEightWeeksData(eightWeeksDataObj);
		const DisputesChartData = {};
		DisputesChartData["weeklyData"] = arrangedDisputesWeeklyData;
		DisputesChartData["monthlyData"] = arrangedDisputesMonthlyData;
		DisputesChartData["eightWeeksData"] = arrangedDisputesEightWeeksData;
		return DisputesChartData;
	}

	async getPendingSummary() {
		const refdocDataLease = await this.dashboardDaoService.getRefdocPendingByDocumentType(DocumentTypeEnum.LEASE);
		const refdocDataUtility = await this.dashboardDaoService.getRefdocPendingByDocumentType(DocumentTypeEnum.UTILITY);
		const proposedApproveRefdocDataLease = await this.dashboardDaoService.getRefdocProposedToApproveByDocumentType(
			DocumentTypeEnum.LEASE
		);
		const proposedApproveRefdocDataUtility = await this.dashboardDaoService.getRefdocProposedToApproveByDocumentType(
			DocumentTypeEnum.UTILITY
		);
		const masterProofData = await this.dashboardDaoService.getPendingMasterProofs();
		const monthlyProofDataPlaid = await this.dashboardDaoService.getPendingMonthlyProofsByMonthlyProofType(
			MonthlyProofTypeEnum.TRANSACTION
		);
		const monthlyProofDataNonPlaid = await this.dashboardDaoService.getPendingMonthlyProofsByMonthlyProofType(
			MonthlyProofTypeEnum.RECEIPT
		);
		const DisputeData = await this.dashboardDaoService.getPendingDisputes();
		return [
			{
				PendingSummaryCode: "CRS_LEASE_ABSORPTION",
				PendingSummaryName: "Lease Absorptions",
				PendingSummaryValue: refdocDataLease?.pendingRefdocs ? refdocDataLease.pendingRefdocs : "0"
			},
			{
				PendingSummaryCode: "CRS_LEASE_VERIFICATION",
				PendingSummaryName: "Lease Approvals ",
				PendingSummaryValue: proposedApproveRefdocDataLease?.proposedToApproveRefdocs
					? proposedApproveRefdocDataLease.proposedToApproveRefdocs
					: "0"
			},

			{
				PendingSummaryCode: "CRS_UTILITY_ABSORPTION",
				PendingSummaryName: "Utility Bill Absorptions",
				PendingSummaryValue: refdocDataUtility?.pendingRefdocs ? refdocDataUtility.pendingRefdocs : "0"
			},
			{
				PendingSummaryCode: "CRS_UTILITY_VERIFICATION",
				PendingSummaryName: "Utility Bill Approvals",
				PendingSummaryValue: proposedApproveRefdocDataUtility?.proposedToApproveRefdocs
					? proposedApproveRefdocDataUtility.proposedToApproveRefdocs
					: "0"
			},
			{
				PendingSummaryCode: "PAYMENT_METHOD",
				PendingSummaryName: "VeriDoc Master Proof Approvals",
				PendingSummaryValue: masterProofData?.pendingMasterProofs ? masterProofData.pendingMasterProofs : "0"
			},
			{
				PendingSummaryCode: "CRS_VERIDOC_MANAGEMENT_PLAID",
				PendingSummaryName: "VeriDoc Monthly Proof Approvals - Plaid",
				PendingSummaryValue: monthlyProofDataPlaid?.pendingMonthlyProofs
					? monthlyProofDataPlaid.pendingMonthlyProofs
					: "0"
			},
			{
				PendingSummaryCode: "CRS_VERIDOC_MANAGEMENT_OTHERS",
				PendingSummaryName: "VeriDoc Monthly Proof Approvals",
				PendingSummaryValue: monthlyProofDataNonPlaid?.pendingMonthlyProofs
					? monthlyProofDataNonPlaid.pendingMonthlyProofs
					: "0"
			},
			{
				PendingSummaryCode: "CRS_DISPUTE_MANAGEMENT",
				PendingSummaryName: "Disputes",
				PendingSummaryValue: DisputeData?.pendingDisputes ? DisputeData.pendingDisputes : "0"
			}
		];
	}
}
