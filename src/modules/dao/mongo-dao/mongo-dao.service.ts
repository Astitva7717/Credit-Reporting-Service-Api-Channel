import { MongoBackofficeApis } from "@modules/mongo/entities/MongoBackofficeApis";
import { MongoCashierApisEntity } from "@modules/mongo/entities/MongoCashierApisEntity";
import { DashboardEightWeeksData } from "@modules/mongo/entities/dashboardEightWeeksDataEntity";
import { DashboardMonthlyData } from "@modules/mongo/entities/dashboardMonthlyDataEntity";
import { DashboardWeeklyData } from "@modules/mongo/entities/dashboardWeeklyDataEntity";
import {
	MongoPlaidData,
	MonthMatchingStatus,
	PlaidTxnStatus,
	ScheduleStatusEnum
} from "@modules/mongo/entities/mongoPlaidDataEntity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MonthNameToNumberEnum } from "@utils/constants/map-month-constants";
import { CommonMongoEntity } from "src/modules/mongo/entities/CommonMongoEntity";
import { Repository } from "typeorm";

@Injectable()
export class MongoDaoService {
	constructor(
		@InjectRepository(MongoBackofficeApis, "mongoDb")
		private getLoginDataRepo: Repository<MongoBackofficeApis>,

		@InjectRepository(CommonMongoEntity, "mongoDb")
		private CommonMongoEntityRepo: Repository<CommonMongoEntity>,

		@InjectRepository(MongoCashierApisEntity, "mongoDb")
		private MongoCashierApisEntityRepo: Repository<MongoCashierApisEntity>,

		@InjectRepository(MongoPlaidData, "mongoDb")
		private MongoPlaidDataRepo: Repository<MongoPlaidData>,

		@InjectRepository(DashboardWeeklyData, "mongoDb")
		private DashboardWeeklyDataRepo: Repository<DashboardWeeklyData>,

		@InjectRepository(DashboardMonthlyData, "mongoDb")
		private DashboardMonthlyDataRepo: Repository<DashboardMonthlyData>,

		@InjectRepository(DashboardEightWeeksData, "mongoDb")
		private DashboardEightWeeksDataRepo: Repository<DashboardEightWeeksData>
	) {}

	async saveCommonMongoEntity(commonMongoEntity: CommonMongoEntity) {
		return await this.CommonMongoEntityRepo.save(commonMongoEntity);
	}

	async saveCashierApiMongoEnitiy(mongoCashierApisEntity: MongoCashierApisEntity) {
		return await this.MongoCashierApisEntityRepo.save(mongoCashierApisEntity);
	}

	async saveMongoBackofficeApis(mongoBackofficeApis: MongoBackofficeApis) {
		return await this.getLoginDataRepo.save(mongoBackofficeApis);
	}

	async saveMongoPlaidData(mongoPlaidData: MongoPlaidData[]) {
		return await this.MongoPlaidDataRepo.save(mongoPlaidData);
	}

	async saveMongoDashboardWeeklyData(dashboardWeeklyData: DashboardWeeklyData[]) {
		return await this.DashboardWeeklyDataRepo.save(dashboardWeeklyData);
	}

	async saveMongoDashboardMonthlyData(dashboardMonthlyData: DashboardMonthlyData[]) {
		return await this.DashboardMonthlyDataRepo.save(dashboardMonthlyData);
	}

	async saveMongoDashboardEightWeeksData(dashboardEightWeeksData: DashboardEightWeeksData[]) {
		return await this.DashboardEightWeeksDataRepo.save(dashboardEightWeeksData);
	}

	async saveSingleMongoPlaidData(mongoPlaidData: MongoPlaidData) {
		return await this.MongoPlaidDataRepo.save(mongoPlaidData);
	}

	async getMongoPlaidDataByRefdocIdAndStatus(refdocId: number, status: PlaidTxnStatus[]) {
		const collection = this.MongoPlaidDataRepo.metadata.connection.getMongoRepository(MongoPlaidData);
		return await collection.find({
			where: {
				refdocId,
				status: { $in: status }
			}
		});
	}

	async getMongoPlaidDataByRefdocIdStatusMonthMatchingStatusAndScheduleStatus(
		refdocId: number,
		status: PlaidTxnStatus[],
		monthMatchingStatus: MonthMatchingStatus[]
	) {
		const collection = this.MongoPlaidDataRepo.metadata.connection.getMongoRepository(MongoPlaidData);
		return await collection.find({
			where: {
				refdocId,
				status: { $in: status },
				monthMatching: { $in: monthMatchingStatus },
				scheduleStatus: ScheduleStatusEnum.UPDATED
			}
		});
	}

	async getMongoPlaidDataByRefdocIdMonthYearAndScheduleStatus(refdocId: number, month: string, year: number) {
		const collection = this.MongoPlaidDataRepo.metadata.connection.getMongoRepository(MongoPlaidData);
		return await collection.find({
			where: {
				refdocId,
				month,
				year,
				scheduleStatus: ScheduleStatusEnum.UPDATED
			}
		});
	}

	async getMongoPlaidDataByMonthlyProofIdAndNotStatus(monthlyProofId: number, status: PlaidTxnStatus[]) {
		const collection = this.MongoPlaidDataRepo.metadata.connection.getMongoRepository(MongoPlaidData);
		return await collection.find({
			where: {
				monthlyProofId,
				status: { $nin: status }
			}
		});
	}

	async getMongoDashboardWeeklyData(date: Date) {
		return await this.DashboardWeeklyDataRepo.findOne({
			where: {
				date
			}
		});
	}

	async getMongoDashboardEightWeeksData(date: Date) {
		return await this.DashboardEightWeeksDataRepo.findOne({
			where: {
				weekStartDate: date
			}
		});
	}

	async getMongoDashboardMonthlyData(month: string) {
		return await this.DashboardMonthlyDataRepo.findOne({
			where: {
				month
			}
		});
	}

	async getMongoPlaidDataByRefdocIdAndTxnIds(key: string, transactionIds: string[], refdocId: number) {
		return await this.MongoPlaidDataRepo.find({
			where: {
				[`plaidData.${key}`]: { $in: transactionIds },
				refdocId
			}
		});
	}

	async getMongoPlaidDataByMasterProofIdAndTxnId(key: string, masterProofId: number, transactionIds: string) {
		return await this.MongoPlaidDataRepo.findOne({
			where: {
				[`plaidData.${key}`]: { $eq: transactionIds },
				masterProofId
			}
		});
	}

	async getMongoPlaidDataByTxnId(key: string, transactionId: string) {
		return await this.MongoPlaidDataRepo.findOne({
			where: {
				[`plaidData.${key}`]: { $eq: transactionId }
			}
		});
	}

	async getMongoPlaidDataByTxnIds(key: string, transactionIds: string[]) {
		return await this.MongoPlaidDataRepo.find({
			where: {
				[`plaidData.${key}`]: { $in: transactionIds }
			}
		});
	}

	async getMongoPlaidDataByStatus(status: PlaidTxnStatus) {
		return await this.MongoPlaidDataRepo.find({
			where: {
				status
			}
		});
	}

	async getMongoPlaidDataByAssignedMonthAndYr(refdocId: number, month: string, year: number) {
		return await this.MongoPlaidDataRepo.find({
			where: {
				refdocId,
				month,
				year
			}
		});
	}

	async getMongoPlaidDataByStatuses(status: PlaidTxnStatus[]) {
		const collection = this.MongoPlaidDataRepo.metadata.connection.getMongoRepository(MongoPlaidData);

		return await collection.find({
			where: {
				status: { $in: status },
				scheduleStatus: { $ne: ScheduleStatusEnum.UPDATED }
			}
		});
	}

	async getMongoPlaidDataForCreditorPayPage(
		plaidTxnsStatus: PlaidTxnStatus[],
		monthMatching: MonthMatchingStatus,
		month: string,
		year: number
	) {
		const collection = this.MongoPlaidDataRepo.metadata.connection.getMongoRepository(MongoPlaidData);

		const query: any = {};
		if (plaidTxnsStatus.length > 0) {
			query.status = { $in: plaidTxnsStatus };
		}
		if (monthMatching) {
			query.monthMatching = monthMatching;
		}
		if (
			!plaidTxnsStatus.includes(PlaidTxnStatus.CRYREMP_QUALIFIED) &&
			!plaidTxnsStatus.includes(PlaidTxnStatus.CRYRBOT_QUALIFIED) &&
			monthMatching !== MonthMatchingStatus.CRYRBOT_ASSIGNED &&
			monthMatching !== MonthMatchingStatus.CRYREMP_ASSIGNED &&
			month &&
			year
		) {
			query.$expr = {
				$and: [
					{
						$eq: [
							{ $month: { $dateFromString: { dateString: "$plaidData.date" } } },
							+MonthNameToNumberEnum[month]
						]
					},
					{
						$eq: [{ $year: { $dateFromString: { dateString: "$plaidData.date" } } }, +year]
					}
				]
			};
		} else if (month && year) {
			query.month = month;
			query.year = +year;
		}

		return await collection.find({
			where: query
		});
	}
}
