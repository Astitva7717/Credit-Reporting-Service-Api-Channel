import { DashboardDaoService } from "@modules/dao/dashboard-dao/dashboard-dao.service";
import { MongoDaoService } from "@modules/dao/mongo-dao/mongo-dao.service";
import { Injectable } from "@nestjs/common";
import { CommonUtilityService } from "@utils/common/common-utility/common-utility.service";
import { MonthMapEnum } from "@utils/constants/map-month-constants";
import { PaymentStatusEnum, YesNoEnum } from "@utils/enums/Status";

@Injectable()
export class DashboardHelperService {
	constructor(
		private readonly dashboardDaoService: DashboardDaoService,
		private readonly commonUtilityServices: CommonUtilityService,
		private readonly mongoDaoService: MongoDaoService
	) {}

	async fetchDataForEightWeeks(
		eightWeeksStartDate: Date,
		eightWeeksEndDate: Date,
		status: PaymentStatusEnum,
		boolStatus: YesNoEnum,
		fetchDataType?: string
	) {
		const weekWiseData = [];
		while (eightWeeksStartDate <= eightWeeksEndDate) {
			let endDateForQuery = new Date(eightWeeksStartDate);
			endDateForQuery.setDate(eightWeeksStartDate.getDate() + 6);
			if (endDateForQuery >= eightWeeksEndDate) {
				endDateForQuery = eightWeeksEndDate;
			}
			let weekDataObj = {};
			let eightWeeksData;
			if (fetchDataType) {
				eightWeeksData = await this.dashboardDaoService.getSubscriptionAmountDataOfWeek(
					eightWeeksStartDate,
					endDateForQuery,
					status,
					boolStatus
				);
			} else {
				eightWeeksData = await this.dashboardDaoService.getSubscriptionDataOfWeek(
					eightWeeksStartDate,
					endDateForQuery,
					status,
					boolStatus
				);
			}

			weekDataObj["weekStartDate"] = eightWeeksStartDate;
			if (eightWeeksData.weekData) {
				weekDataObj["weekData"] = eightWeeksData.weekData;
			} else {
				weekDataObj["weekData"] = "0";
			}

			weekWiseData.push(weekDataObj);
			eightWeeksStartDate = new Date(endDateForQuery);
			eightWeeksStartDate.setDate(endDateForQuery.getDate() + 1);
		}
		return weekWiseData;
	}

	async fetchUserRegistersDataForEightWeeks(eightWeeksStartDate: Date, eightWeeksEndDate: Date) {
		const weekWiseData = [];
		while (eightWeeksStartDate <= eightWeeksEndDate) {
			let endDateForQuery = new Date(eightWeeksStartDate);
			endDateForQuery.setDate(eightWeeksStartDate.getDate() + 6);
			if (endDateForQuery >= eightWeeksEndDate) {
				endDateForQuery = eightWeeksEndDate;
			}
			let weekDataObj = {};
			const eightWeeksData = await this.dashboardDaoService.getUsersRegisteredOfWeek(
				eightWeeksStartDate,
				endDateForQuery
			);

			weekDataObj["weekStartDate"] = eightWeeksStartDate;
			if (eightWeeksData.weekData) {
				weekDataObj["weekData"] = eightWeeksData.weekData;
			} else {
				weekDataObj["weekData"] = "0";
			}

			weekWiseData.push(weekDataObj);
			eightWeeksStartDate = new Date(endDateForQuery);
			eightWeeksStartDate.setDate(endDateForQuery.getDate() + 1);
		}
		return weekWiseData;
	}

	async fetchRefdocUploadsDataForEightWeeks(eightWeeksStartDate: Date, eightWeeksEndDate: Date) {
		const weekWiseData = [];
		while (eightWeeksStartDate <= eightWeeksEndDate) {
			let endDateForQuery = new Date(eightWeeksStartDate);
			endDateForQuery.setDate(eightWeeksStartDate.getDate() + 6);
			if (endDateForQuery >= eightWeeksEndDate) {
				endDateForQuery = eightWeeksEndDate;
			}
			let weekDataObj = {};
			const eightWeeksData = await this.dashboardDaoService.getRefdocUploadDataOfWeek(
				eightWeeksStartDate,
				endDateForQuery
			);

			weekDataObj["weekStartDate"] = eightWeeksStartDate;
			if (eightWeeksData.weekData) {
				weekDataObj["weekData"] = eightWeeksData.weekData;
			} else {
				weekDataObj["weekData"] = "0";
			}

			weekWiseData.push(weekDataObj);
			eightWeeksStartDate = new Date(endDateForQuery);
			eightWeeksStartDate.setDate(endDateForQuery.getDate() + 1);
		}
		return weekWiseData;
	}

	async fetchRefdocVerifiedDataForEightWeeks(eightWeeksStartDate: Date, eightWeeksEndDate: Date) {
		const weekWiseData = [];
		while (eightWeeksStartDate <= eightWeeksEndDate) {
			let endDateForQuery = new Date(eightWeeksStartDate);
			endDateForQuery.setDate(eightWeeksStartDate.getDate() + 6);
			if (endDateForQuery >= eightWeeksEndDate) {
				endDateForQuery = eightWeeksEndDate;
			}
			let weekDataObj = {};
			const eightWeeksData = await this.dashboardDaoService.getRefdocVerifiedDataOfWeek(
				eightWeeksStartDate,
				endDateForQuery
			);

			weekDataObj["weekStartDate"] = eightWeeksStartDate;
			if (eightWeeksData.weekData) {
				weekDataObj["weekData"] = eightWeeksData.weekData;
			} else {
				weekDataObj["weekData"] = "0";
			}

			weekWiseData.push(weekDataObj);
			eightWeeksStartDate = new Date(endDateForQuery);
			eightWeeksStartDate.setDate(endDateForQuery.getDate() + 1);
		}
		return weekWiseData;
	}

	async fetchDisputeDataForEightWeeks(eightWeeksStartDate: Date, eightWeeksEndDate: Date, fetchDataType?: string) {
		const weekWiseData = [];
		while (eightWeeksStartDate <= eightWeeksEndDate) {
			let endDateForQuery = new Date(eightWeeksStartDate);
			endDateForQuery.setDate(eightWeeksStartDate.getDate() + 6);
			if (endDateForQuery >= eightWeeksEndDate) {
				endDateForQuery = eightWeeksEndDate;
			}
			let weekDataObj = {};
			let eightWeeksData;
			if (fetchDataType) {
				eightWeeksData = await this.dashboardDaoService.getDisputeRaisedDataOfWeek(
					eightWeeksStartDate,
					endDateForQuery
				);
			} else {
				eightWeeksData = await this.dashboardDaoService.getDisputeClosedDataOfWeek(
					eightWeeksStartDate,
					endDateForQuery
				);
			}
			weekDataObj["weekStartDate"] = eightWeeksStartDate;
			if (eightWeeksData.weekData) {
				weekDataObj["weekData"] = eightWeeksData.weekData;
			} else {
				weekDataObj["weekData"] = "0";
			}

			weekWiseData.push(weekDataObj);
			eightWeeksStartDate = new Date(endDateForQuery);
			eightWeeksStartDate.setDate(endDateForQuery.getDate() + 1);
		}
		return weekWiseData;
	}

	async fetchReportingDataForEightWeeks(eightWeeksStartDate: Date, eightWeeksEndDate: Date) {
		const weekWiseData = [];
		while (eightWeeksStartDate <= eightWeeksEndDate) {
			let endDateForQuery = new Date(eightWeeksStartDate);
			endDateForQuery.setDate(eightWeeksStartDate.getDate() + 6);
			if (endDateForQuery >= eightWeeksEndDate) {
				endDateForQuery = eightWeeksEndDate;
			}
			let weekDataObj = {};
			let eightWeeksData;
			eightWeeksData = [];
			weekDataObj["weekStartDate"] = eightWeeksStartDate;
			if (eightWeeksData.weekData) {
				weekDataObj["weekData"] = eightWeeksData.weekData;
			} else {
				weekDataObj["weekData"] = "0";
			}

			weekWiseData.push(weekDataObj);
			eightWeeksStartDate = new Date(endDateForQuery);
			eightWeeksStartDate.setDate(endDateForQuery.getDate() + 1);
		}
		return weekWiseData;
	}

	arrangeEightWeeksData(eightWeeksDataObj) {
		const arrangedEightWeeksDataObj = { xAxis: [] };

		const yAxisArr = [];

		Object.keys(eightWeeksDataObj).forEach((dataName) => {
			const yAxisObj = { data: [] };
			yAxisObj["name"] = dataName;
			yAxisArr.push(yAxisObj);
		});

		Object.values(eightWeeksDataObj).forEach((eightWeeksData: any, index) => {
			eightWeeksData.forEach((weekDataObj) => {
				if (index === 0) {
					const date = this.commonUtilityServices.getDateWithMonthName(weekDataObj["weekStartDate"]);
					arrangedEightWeeksDataObj["xAxis"].push(date);
				}
				yAxisArr[index]["data"].push(weekDataObj["weekData"].toString());
			});
		});

		arrangedEightWeeksDataObj["yAxis"] = yAxisArr;
		return arrangedEightWeeksDataObj;
	}

	arrangeMultipleWeeklyData(weekStartDate: Date, endDate: Date, weeklyDataObj) {
		const weeklyDateDataArr = [];
		while (weekStartDate <= endDate) {
			weeklyDateDataArr.push(weekStartDate);
			weekStartDate = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate() + 1);
		}
		const weeklyDateDataObj = {};
		const namesWeeklyData = Object.keys(weeklyDataObj);
		Object.values(weeklyDataObj).forEach((weeklyData: any, index) => {
			weeklyData.forEach((data: any) => {
				if (!weeklyDateDataObj[namesWeeklyData[index]]) {
					weeklyDateDataObj[namesWeeklyData[index]] = {};
				}
				weeklyDateDataObj[namesWeeklyData[index]][data.day] = data.value;
			});
		});
		const nonEmptyDataNames = Object.keys(weeklyDateDataObj);

		const snapshotWeeklyDataObj = { xAxis: [] };

		const yAxisArr = [];

		weeklyDateDataArr.forEach((data) => {
			const date = this.commonUtilityServices.getDateWithMonthName(data);
			snapshotWeeklyDataObj["xAxis"].push(date);

			Object.values(weeklyDateDataObj).forEach((weeklyData, index) => {
				const yAxisObj = { data: [] };
				if (Object.keys(weeklyData).includes(data.toString())) {
					if (!yAxisArr[index]) {
						yAxisObj["data"].push(weeklyData[data].toString());
						yAxisObj["name"] = nonEmptyDataNames[index];
						yAxisArr.push(yAxisObj);
					} else {
						yAxisArr[index]["data"].push(weeklyData[data].toString());
					}
				} else if (!yAxisArr[index]) {
					yAxisObj["data"].push("0");
					yAxisObj["name"] = nonEmptyDataNames[index];
					yAxisArr.push(yAxisObj);
				} else {
					yAxisArr[index]["data"].push("0");
				}
			});
		});
		this.handleEmptyYAxisData(yAxisArr, namesWeeklyData, snapshotWeeklyDataObj, nonEmptyDataNames);
		snapshotWeeklyDataObj["yAxis"] = yAxisArr;
		return snapshotWeeklyDataObj;
	}

	handleEmptyYAxisData(yAxisArr, namesData, snapshotDataObj, nonEmptyDataNames) {
		namesData.forEach((dataName) => {
			if (!nonEmptyDataNames.includes(dataName)) {
				const yAxisObj = { data: [] };
				yAxisObj["data"].push(...Array(snapshotDataObj["xAxis"].length).fill("0"));
				yAxisObj["name"] = dataName;
				yAxisArr.push(yAxisObj);
			}
		});
	}

	arrangeMultipleMonthlyData(monthStartDate: Date, endDate: Date, monthlyDataObj) {
		const monthlyNameDataArr = [];
		while (monthStartDate <= endDate) {
			const monthName = MonthMapEnum[(monthStartDate.getMonth() + 1).toString()];
			const monthNameWithYear = `${monthName}` + " " + `${monthStartDate.getFullYear()}`;
			monthlyNameDataArr.push(monthNameWithYear);
			monthStartDate = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, monthStartDate.getDate());
		}
		const monthlyDateDataObj = {};
		const namesMonthlyData = Object.keys(monthlyDataObj);
		Object.values(monthlyDataObj).forEach((monthlyData: any, index) => {
			monthlyData.forEach((data: any) => {
				if (!monthlyDateDataObj[namesMonthlyData[index]]) {
					monthlyDateDataObj[namesMonthlyData[index]] = {};
				}
				const key = data.month.slice(0, 3);
				monthlyDateDataObj[namesMonthlyData[index]][key] = data.value;
			});
		});
		const nonEmptyDataNames = Object.keys(monthlyDateDataObj);
		const snapshotMonthlyDataObj = { xAxis: [] };

		const yAxisArr = [];

		monthlyNameDataArr.forEach((data) => {
			snapshotMonthlyDataObj["xAxis"].push(data);
			Object.values(monthlyDateDataObj).forEach((monthlyData, index) => {
				const yAxisObj = { data: [] };
				if (Object.keys(monthlyData).includes(data.toString().split(" ")[0])) {
					if (!yAxisArr[index]) {
						yAxisObj["data"].push(monthlyData[data.split(" ")[0]].toString());
						yAxisObj["name"] = nonEmptyDataNames[index];
						yAxisArr.push(yAxisObj);
					} else {
						yAxisArr[index]["data"].push(monthlyData[data.split(" ")[0]].toString());
					}
				} else if (!yAxisArr[index]) {
					yAxisObj["data"].push("0");
					yAxisObj["name"] = nonEmptyDataNames[index];
					yAxisArr.push(yAxisObj);
				} else {
					yAxisArr[index]["data"].push("0");
				}
			});
		});
		this.handleEmptyYAxisData(yAxisArr, namesMonthlyData, snapshotMonthlyDataObj, nonEmptyDataNames);
		snapshotMonthlyDataObj["yAxis"] = yAxisArr;
		return snapshotMonthlyDataObj;
	}

	arrangeCumulativeData(snapShotData: any) {
		const yAxisArr = snapShotData.yAxis;
		yAxisArr.forEach((yAxisObj) => {
			const data = yAxisObj.data;
			data.reduce((accumulator, currentData, index) => {
				accumulator = accumulator + +currentData;
				data[index] = accumulator.toString();
				return accumulator;
			}, 0);
			yAxisObj.data = data;
		});
	}

	async getSnapshotGraphsDataMongo(key) {
		let {
			endDate,
			weekStartDate,
			newWeekStartDate,
			monthStartDate,
			newMonthStartDate,
			eightWeeksEndDate,
			eightWeeksStartDate
		} = this.createDatesForDashboardDataFetch();
		let weeklyOldSubsData, weeklyUserData, weeklyRefdocUploads, weeklyVerifiedRefdocs;
		let monthlyOldSubsData, monthlyUserData, monthlyRefdocUploads, monthlyVerifiedRefdocs;
		let eightWeeksOldSubsData, eightWeeksUserData, eightWeeksRefdocUploads, eightWeeksVerifiedRefdocs;
		let monthlyNewSubsData = [];
		let weeklyNewSubsData = [];
		let eightWeeksNewSubsData = [];

		if (key === "SubscriptionData") {
			weeklyOldSubsData = [];
			monthlyOldSubsData = [];
			eightWeeksOldSubsData = [];
		} else {
			weeklyUserData = [];
			weeklyRefdocUploads = [];
			weeklyVerifiedRefdocs = [];
			monthlyUserData = [];
			monthlyRefdocUploads = [];
			monthlyVerifiedRefdocs = [];
			eightWeeksUserData = [];
			eightWeeksRefdocUploads = [];
			eightWeeksVerifiedRefdocs = [];
		}

		weekStartDate.setMilliseconds(0);
		while (endDate?.getTime() > weekStartDate?.getTime()) {
			const dashboardData = await this.mongoDaoService.getMongoDashboardWeeklyData(weekStartDate);
			if (dashboardData?.newSubscriptions) {
				const newSubsDataObj = {};
				newSubsDataObj["day"] = dashboardData.date;
				newSubsDataObj["value"] = dashboardData.newSubscriptions;
				weeklyNewSubsData.push(newSubsDataObj);
			}

			if (key === "SubscriptionData") {
				if (dashboardData?.recurringSubscriptions) {
					const oldSubsDataObj = {};
					oldSubsDataObj["day"] = dashboardData.date;
					oldSubsDataObj["value"] = dashboardData.recurringSubscriptions;
					weeklyOldSubsData.push(oldSubsDataObj);
				}
			} else {
				if (dashboardData?.registeredUsers) {
					const userDataObj = {};
					userDataObj["day"] = dashboardData.date;
					userDataObj["value"] = dashboardData.registeredUsers;
					weeklyUserData.push(userDataObj);
				}
				if (dashboardData?.refdocUploads) {
					const refdocUploadsDataObj = {};
					refdocUploadsDataObj["day"] = dashboardData.date;
					refdocUploadsDataObj["value"] = dashboardData.refdocUploads;
					weeklyRefdocUploads.push(refdocUploadsDataObj);
				}
				if (dashboardData?.verifiedRefdoc) {
					const verifiedRefdocDataObj = {};
					verifiedRefdocDataObj["day"] = dashboardData.date;
					verifiedRefdocDataObj["value"] = dashboardData.verifiedRefdoc;
					weeklyVerifiedRefdocs.push(verifiedRefdocDataObj);
				}
			}

			weekStartDate = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate() + 1);
		}

		const currentMonthName = MonthMapEnum[(endDate.getMonth() + 1).toString()];
		monthStartDate.setMilliseconds(0);
		while (endDate?.getTime() > monthStartDate?.getTime()) {
			const monthName = MonthMapEnum[(monthStartDate.getMonth() + 1).toString()];
			const dashboardData = await this.mongoDaoService.getMongoDashboardMonthlyData(monthName);
			if (dashboardData?.newSubscriptions) {
				const newSubsDataObj = {};
				newSubsDataObj["month"] = dashboardData.month;
				newSubsDataObj["value"] = dashboardData.newSubscriptions;
				monthlyNewSubsData.push(newSubsDataObj);
			}
			if (key === "SubscriptionData") {
				if (dashboardData?.recurringSubscriptions) {
					const oldSubsDataObj = {};
					oldSubsDataObj["month"] = dashboardData.month;
					oldSubsDataObj["value"] = dashboardData.recurringSubscriptions;
					monthlyOldSubsData.push(oldSubsDataObj);
				}
			} else {
				if (dashboardData?.registeredUsers) {
					const userDataObj = {};
					userDataObj["month"] = dashboardData.month;
					userDataObj["value"] = dashboardData.registeredUsers;
					monthlyUserData.push(userDataObj);
				}
				if (dashboardData?.refdocUploads) {
					const refdocUploadsDataObj = {};
					refdocUploadsDataObj["month"] = dashboardData.month;
					refdocUploadsDataObj["value"] = dashboardData.refdocUploads;
					monthlyRefdocUploads.push(refdocUploadsDataObj);
				}
				if (dashboardData?.verifiedRefdoc) {
					const verifiedRefdocDataObj = {};
					verifiedRefdocDataObj["month"] = dashboardData.month;
					verifiedRefdocDataObj["value"] = dashboardData.verifiedRefdoc;
					monthlyVerifiedRefdocs.push(verifiedRefdocDataObj);
				}
			}

			monthStartDate = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, monthStartDate.getDate());
		}

		eightWeeksStartDate.setMilliseconds(0);
		while (eightWeeksEndDate?.getTime() > eightWeeksStartDate?.getTime()) {
			const dashboardData = await this.mongoDaoService.getMongoDashboardEightWeeksData(eightWeeksStartDate);
			if (dashboardData?.newSubscriptions) {
				const newSubsDataObj = {};
				newSubsDataObj["weekStartDate"] = dashboardData.weekStartDate;
				newSubsDataObj["weekData"] = dashboardData.newSubscriptions;
				eightWeeksNewSubsData.push(newSubsDataObj);
			}
			if (key === "SubscriptionData") {
				if (dashboardData?.recurringSubscriptions) {
					const oldSubsDataObj = {};
					oldSubsDataObj["weekStartDate"] = dashboardData.weekStartDate;
					oldSubsDataObj["weekData"] = dashboardData.recurringSubscriptions;
					eightWeeksOldSubsData.push(oldSubsDataObj);
				}
			} else {
				if (dashboardData?.registeredUsers) {
					const userDataObj = {};
					userDataObj["weekStartDate"] = dashboardData.weekStartDate;
					userDataObj["weekData"] = dashboardData.registeredUsers;
					eightWeeksUserData.push(userDataObj);
				}
				if (dashboardData?.refdocUploads) {
					const refdocUploadsDataObj = {};
					refdocUploadsDataObj["weekStartDate"] = dashboardData.weekStartDate;
					refdocUploadsDataObj["weekData"] = dashboardData.refdocUploads;
					eightWeeksRefdocUploads.push(refdocUploadsDataObj);
				}
				if (dashboardData?.verifiedRefdoc) {
					const verifiedRefdocDataObj = {};
					verifiedRefdocDataObj["weekStartDate"] = dashboardData.weekStartDate;
					verifiedRefdocDataObj["weekData"] = dashboardData.verifiedRefdoc;
					eightWeeksVerifiedRefdocs.push(verifiedRefdocDataObj);
				}
			}
			eightWeeksStartDate.setDate(eightWeeksStartDate.getDate() + 7);
		}

		const endDateWithTime = new Date();
		const currentDayNewSubsData = await this.dashboardDaoService.getWeeklySubscriptionData(
			endDate,
			endDateWithTime,
			PaymentStatusEnum.PAYMENT_DONE,
			YesNoEnum.YES
		);
		if (currentDayNewSubsData.length) {
			weeklyNewSubsData.push(currentDayNewSubsData[0]);
			let currentMonthDataAdded = false;
			monthlyNewSubsData.forEach((data) => {
				if (data["month"] === currentMonthName) {
					data["value"] = (+data["value"] + +currentDayNewSubsData[0]["value"]).toString();
					currentMonthDataAdded = true;
				}
			});
			if (!currentMonthDataAdded) {
				const newSubsDataObj = {};
				newSubsDataObj["month"] = currentMonthName;
				newSubsDataObj["value"] = currentDayNewSubsData[0]["value"].toString();
				monthlyNewSubsData.push(newSubsDataObj);
			}
			let currentWeekDataAdded = false;
			eightWeeksNewSubsData.forEach((data) => {
				if (data["weekStartDate"]?.getTime() === eightWeeksStartDate?.getTime()) {
					data["weekData"] = (+data["weekData"] + +currentDayNewSubsData[0]["value"]).toString();
					currentWeekDataAdded = true;
				}
			});
			if (!currentWeekDataAdded) {
				const newSubsDataObj = {};
				newSubsDataObj["weekStartDate"] = eightWeeksStartDate;
				newSubsDataObj["weekData"] = currentDayNewSubsData[0]["value"].toString();
				eightWeeksNewSubsData.push(newSubsDataObj);
			}
		}

		const weeklyDataObj = {};
		weeklyDataObj["New Subscriptions"] = weeklyNewSubsData;

		const monthlyDataObj = {};
		monthlyDataObj["New Subscriptions"] = monthlyNewSubsData;

		const eightWeeksDataObj = {};
		eightWeeksDataObj["New Subscriptions"] = eightWeeksNewSubsData;

		if (key === "SubscriptionData") {
			const currentDayOldSubsData = await this.dashboardDaoService.getWeeklySubscriptionData(
				endDate,
				endDateWithTime,
				PaymentStatusEnum.PAYMENT_DONE,
				YesNoEnum.NO
			);
			if (currentDayOldSubsData.length) {
				weeklyOldSubsData.push(currentDayOldSubsData[0]);
				let currentMonthDataAdded = false;
				monthlyOldSubsData.forEach((data) => {
					if (data["month"] === currentMonthName) {
						data["value"] = (+data["value"] + +currentDayOldSubsData[0]["value"]).toString();
						currentMonthDataAdded = true;
					}
				});
				if (!currentMonthDataAdded) {
					const oldSubsDataObj = {};
					oldSubsDataObj["month"] = currentMonthName;
					oldSubsDataObj["value"] = currentDayOldSubsData[0]["value"].toString();
					monthlyOldSubsData.push(oldSubsDataObj);
				}
				let currentWeekDataAdded = false;
				eightWeeksOldSubsData.forEach((data) => {
					if (data["weekStartDate"]?.getTime() === eightWeeksStartDate?.getTime()) {
						data["weekData"] = (+data["weekData"] + +currentDayOldSubsData[0]["value"]).toString();
						currentWeekDataAdded = true;
					}
				});
				if (!currentWeekDataAdded) {
					const oldSubsDataObj = {};
					oldSubsDataObj["weekStartDate"] = eightWeeksStartDate;
					oldSubsDataObj["weekData"] = currentDayOldSubsData[0]["value"].toString();
					eightWeeksOldSubsData.push(oldSubsDataObj);
				}
			}
			weeklyDataObj["Recurring Subscriptions"] = weeklyOldSubsData;
			monthlyDataObj["Recurring Subscriptions"] = monthlyOldSubsData;
			eightWeeksDataObj["Recurring Subscriptions"] = eightWeeksOldSubsData;
		} else {
			const currentDayUsersData = await this.dashboardDaoService.getWeeklyUsersRegistered(endDate, endDateWithTime);
			if (currentDayUsersData.length) {
				weeklyUserData.push(currentDayUsersData[0]);
				let currentMonthDataAdded = false;
				monthlyUserData.forEach((data) => {
					if (data["month"] === currentMonthName) {
						data["value"] = (+data["value"] + +currentDayUsersData[0]["value"]).toString();
						currentMonthDataAdded = true;
					}
				});
				if (!currentMonthDataAdded) {
					const userDataObj = {};
					userDataObj["month"] = currentMonthName;
					userDataObj["value"] = currentDayUsersData[0]["value"].toString();
					monthlyUserData.push(userDataObj);
				}
				let currentWeekDataAdded = false;
				eightWeeksUserData.forEach((data) => {
					if (data["weekStartDate"]?.getTime() === eightWeeksStartDate?.getTime()) {
						data["weekData"] = (+data["weekData"] + +currentDayUsersData[0]["value"]).toString();
						currentWeekDataAdded = true;
					}
				});
				if (!currentWeekDataAdded) {
					const userDataObj = {};
					userDataObj["weekStartDate"] = eightWeeksStartDate;
					userDataObj["weekData"] = currentDayUsersData[0]["value"].toString();
					eightWeeksUserData.push(userDataObj);
				}
			}

			const currentDayRefdocUploadsData = await this.dashboardDaoService.getWeeklyRefdocUploadData(
				endDate,
				endDateWithTime
			);
			if (currentDayRefdocUploadsData.length) {
				weeklyRefdocUploads.push(currentDayRefdocUploadsData[0]);
				let currentMonthDataAdded = false;
				monthlyRefdocUploads.forEach((data) => {
					if (data["month"] === currentMonthName) {
						data["value"] = (+data["value"] + +currentDayRefdocUploadsData[0]["value"]).toString();
						currentMonthDataAdded = true;
					}
				});
				if (!currentMonthDataAdded) {
					const refdocUploadsObj = {};
					refdocUploadsObj["month"] = currentMonthName;
					refdocUploadsObj["value"] = currentDayRefdocUploadsData[0]["value"].toString();
					monthlyRefdocUploads.push(refdocUploadsObj);
				}
				let currentWeekDataAdded = false;
				eightWeeksRefdocUploads.forEach((data) => {
					if (data["weekStartDate"]?.getTime() === eightWeeksStartDate?.getTime()) {
						data["weekData"] = (+data["weekData"] + +currentDayRefdocUploadsData[0]["value"]).toString();
						currentWeekDataAdded = true;
					}
				});
				if (!currentWeekDataAdded) {
					const refdocUploadsObj = {};
					refdocUploadsObj["weekStartDate"] = eightWeeksStartDate;
					refdocUploadsObj["weekData"] = currentDayRefdocUploadsData[0]["value"].toString();
					eightWeeksRefdocUploads.push(refdocUploadsObj);
				}
			}

			const currentDayRefdocVerifiedData = await this.dashboardDaoService.getWeeklyRefdocVerifiedData(
				endDate,
				endDateWithTime
			);
			if (currentDayRefdocVerifiedData.length) {
				weeklyVerifiedRefdocs.push(currentDayRefdocVerifiedData[0]);
				let currentMonthDataAdded = false;
				monthlyVerifiedRefdocs.forEach((data) => {
					if (data["month"] === currentMonthName) {
						data["value"] = (+data["value"] + +currentDayRefdocVerifiedData[0]["value"]).toString();
						currentMonthDataAdded = true;
					}
				});
				if (!currentMonthDataAdded) {
					const verifiedRefdocsObj = {};
					verifiedRefdocsObj["month"] = currentMonthName;
					verifiedRefdocsObj["value"] = currentDayRefdocVerifiedData[0]["value"].toString();
					monthlyVerifiedRefdocs.push(verifiedRefdocsObj);
				}
				let currentWeekDataAdded = false;
				eightWeeksVerifiedRefdocs.forEach((data) => {
					if (data["weekStartDate"]?.getTime() === eightWeeksStartDate?.getTime()) {
						data["weekData"] = (+data["weekData"] + +currentDayRefdocVerifiedData[0]["value"]).toString();
						currentWeekDataAdded = true;
					}
				});
				if (!currentWeekDataAdded) {
					const verifiedRefdocsObj = {};
					verifiedRefdocsObj["weekStartDate"] = eightWeeksStartDate;
					verifiedRefdocsObj["weekData"] = currentDayRefdocVerifiedData[0]["value"].toString();
					eightWeeksVerifiedRefdocs.push(verifiedRefdocsObj);
				}
			}

			weeklyDataObj["Registered Users"] = weeklyUserData;
			weeklyDataObj["Refdoc Uploads"] = weeklyRefdocUploads;
			weeklyDataObj["Verified Refdoc"] = weeklyVerifiedRefdocs;

			monthlyDataObj["Registered Users"] = monthlyUserData;
			monthlyDataObj["Refdoc Uploads"] = monthlyRefdocUploads;
			monthlyDataObj["Verified Refdoc"] = monthlyVerifiedRefdocs;

			eightWeeksDataObj["Registered Users"] = eightWeeksUserData;
			eightWeeksDataObj["Refdoc Uploads"] = eightWeeksRefdocUploads;
			eightWeeksDataObj["Verified Refdoc"] = eightWeeksVerifiedRefdocs;
		}

		const weeklyData = this.arrangeMultipleWeeklyData(newWeekStartDate, endDate, weeklyDataObj);
		const monthlyData = this.arrangeMultipleMonthlyData(newMonthStartDate, endDate, monthlyDataObj);
		const eightWeeksData = this.arrangeEightWeeksData(eightWeeksDataObj);
		return { weeklyData, monthlyData, eightWeeksData };
	}

	getSundayDate(currentDate: Date) {
		const dayOfWeek = currentDate.getDay();
		const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
		const sundayDate = new Date(currentDate);
		sundayDate.setDate(currentDate.getDate() + daysUntilSunday);
		return sundayDate;
	}

	changeAmountDataUpToTwoDecimal(amounData) {
		amounData.forEach((data) => {
			if (data.value && data.value !== "0") {
				data.value = parseFloat(data.value.toFixed(2));
			} else if (data.weekData && data.weekData !== "0") {
				data.weekData = parseFloat(data.weekData.toFixed(2));
			}
		});
	}

	checkForNullvalues(entity) {
		const entityValues = Object.values(entity);
		for (const value of entityValues) {
			if (value) {
				return false;
			}
		}
		return true;
	}

	createDatesForDashboardDataFetch() {
		const endDate = new Date();
		endDate.setHours(0);
		endDate.setMinutes(0);
		endDate.setSeconds(0);
		endDate.setMilliseconds(0);
		let weekStartDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 7);
		let newWeekStartDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 7);
		let monthStartDate = new Date(endDate.getFullYear(), endDate.getMonth() - 7, 1);
		let newMonthStartDate = new Date(endDate.getFullYear(), endDate.getMonth() - 7, 1);
		const eightWeeksEndDate = this.getSundayDate(endDate);
		const eightWeeksStartDate = new Date(eightWeeksEndDate);
		eightWeeksStartDate.setDate(eightWeeksEndDate.getDate() - 55);
		eightWeeksStartDate.setHours(0);
		eightWeeksStartDate.setMinutes(0);
		eightWeeksStartDate.setSeconds(0);
		eightWeeksStartDate.setMilliseconds(0);
		return {
			endDate,
			weekStartDate,
			newWeekStartDate,
			monthStartDate,
			newMonthStartDate,
			eightWeeksEndDate,
			eightWeeksStartDate
		};
	}

	async updatePreviousDayDisputeChartData(
		weeklyDisputesRaisedData,
		monthlyDisputesRaisedData,
		eightWeeksDisputesRaisedData,
		weeklyDisputesClosedData,
		monthlyDisputesClosedData,
		eightWeeksDisputesClosedData,
		dateObj
	) {
		const { endDate, eightWeeksStartDate } = dateObj;
		const currentMonthName = MonthMapEnum[(endDate.getMonth() + 1).toString()];
		const endDateWithTime = new Date();
		const currentDayDisputeRaised = await this.dashboardDaoService.getWeeklyDisputeRaisedData(endDate, endDateWithTime);

		if (currentDayDisputeRaised.length) {
			weeklyDisputesRaisedData.push(currentDayDisputeRaised[0]);
			let currentMonthDataAdded = false;
			monthlyDisputesRaisedData.forEach((data) => {
				if (data["month"] === currentMonthName) {
					data["value"] = (+data["value"] + +currentDayDisputeRaised[0]["value"]).toString();
					currentMonthDataAdded = true;
				}
			});
			if (!currentMonthDataAdded) {
				const disputesRaisedObj = {};
				disputesRaisedObj["month"] = currentMonthName;
				disputesRaisedObj["value"] = currentDayDisputeRaised[0]["value"].toString();
				monthlyDisputesRaisedData.push(disputesRaisedObj);
			}
			let currentWeekDataAdded = false;
			eightWeeksDisputesRaisedData.forEach((data) => {
				if (data["weekStartDate"]?.getTime() === eightWeeksStartDate?.getTime()) {
					data["weekData"] = (+data["weekData"] + +currentDayDisputeRaised[0]["value"]).toString();
					currentWeekDataAdded = true;
				}
			});
			if (!currentWeekDataAdded) {
				const disputesRaisedObj = {};
				disputesRaisedObj["weekStartDate"] = eightWeeksStartDate;
				disputesRaisedObj["weekData"] = currentDayDisputeRaised[0]["value"].toString();
				eightWeeksDisputesRaisedData.push(disputesRaisedObj);
			}
		}
		const currentDayDisputesClosed = await this.dashboardDaoService.getWeeklyDisputeClosedData(endDate, endDateWithTime);

		if (currentDayDisputesClosed.length) {
			weeklyDisputesClosedData.push(currentDayDisputesClosed[0]);
			let currentMonthDataAdded = false;
			monthlyDisputesClosedData.forEach((data) => {
				if (data["month"] === currentMonthName) {
					data["value"] = (+data["value"] + +currentDayDisputesClosed[0]["value"]).toString();
					currentMonthDataAdded = true;
				}
			});
			if (!currentMonthDataAdded) {
				const disputesClosedObj = {};
				disputesClosedObj["month"] = currentMonthName;
				disputesClosedObj["value"] = currentDayDisputesClosed[0]["value"].toString();
				monthlyDisputesClosedData.push(disputesClosedObj);
			}
			let currentWeekDataAdded = false;
			eightWeeksDisputesClosedData.forEach((data) => {
				if (data["weekStartDate"]?.getTime() === eightWeeksStartDate?.getTime()) {
					data["weekData"] = (+data["weekData"] + +currentDayDisputesClosed[0]["value"]).toString();
					currentWeekDataAdded = true;
				}
			});
			if (!currentWeekDataAdded) {
				const disputesClosedObj = {};
				disputesClosedObj["weekStartDate"] = eightWeeksStartDate;
				disputesClosedObj["weekData"] = currentDayDisputesClosed[0]["value"].toString();
				eightWeeksDisputesClosedData.push(disputesClosedObj);
			}
		}
	}
}
