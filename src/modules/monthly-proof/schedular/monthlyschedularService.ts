import { MonthlyDocDaoService } from "@modules/dao/monthly-doc-dao/monthly-doc-dao.service";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CommonUtilityService } from "@utils/common/common-utility/common-utility.service";
import { MonthlyProofStatusEnum, PaymentStatusEnum } from "@utils/enums/Status";
import { MonthlyProofTypeEnum } from "@utils/enums/txn-types";
import { MonthlyProofHelperService } from "../monthly-Proof-helper/monthlyProof-helper.service";
import { Transaction } from "plaid";
import { AppLoggerDto } from "@app-logger/app-logger.dto";
import VariablesConstant from "@utils/variables-constant";
import { AppLoggerService } from "@app-logger/app-logger.service";
import { SchedulerHelperService } from "@utils/common/scheduler-helper/scheduler-helper.service";
import { Cron } from "@nestjs/schedule";
import { ResponseData } from "@utils/enums/response";
import { PaymentSchedule, PaymentScheduleStatus } from "@modules/doc/entities/payment-schedule.entity";
import { ValidationDocMonthlyProof } from "../entities/validation-doc-monthly-proof.entity";
import { MonthMapEnum } from "@utils/constants/map-month-constants";
import { DocDaoService } from "@modules/dao/doc-dao/doc-dao.service";
import { MasterProofTypeEnum, ProofStatus } from "@modules/doc/entities/validation-doc-master-proof.entity";
import { ConfigService } from "src/config";
import { DataSource, QueryRunner } from "typeorm";
import { PlaidService } from "@modules/plaid/plaid.service";
import { UserPaymentScheduleStatus } from "@modules/doc/entities/user-payment-schedule.entity";
import { PackageDaoService } from "@modules/dao/package-dao/package-dao.service";
import { UserSubscriptionTransactions } from "@modules/package/entities/user-subscription-txn.entity";
import {
	ReportingStatus,
	UserCreditReportingRequests
} from "@modules/reporting/entities/user-credit-reporting-request.entity";
import { ReportingDaoService } from "@modules/dao/reporting-dao/reporting-dao.service";
import { MongoDaoService } from "@modules/dao/mongo-dao/mongo-dao.service";
import { MongoPlaidData, PlaidTxnStatus } from "@modules/mongo/entities/mongoPlaidDataEntity";
import { UserDaoService } from "@modules/dao/user-dao/user-dao.service";
import { ConfigurationService } from "@utils/configuration/configuration.service";
import { ConfigCodeEnum } from "@utils/enums/constants";

@Injectable()
export class MonthlyProofSchedularService {
	constructor(
		private readonly monthlyDocDaoService: MonthlyDocDaoService,
		private readonly commonUtilityService: CommonUtilityService,
		private readonly plaidService: PlaidService,
		private readonly monthlyProofHelperService: MonthlyProofHelperService,
		private readonly appLoggerService: AppLoggerService,
		private readonly schedulerHelperService: SchedulerHelperService,
		private readonly configService: ConfigService,
		private readonly configurationService: ConfigurationService,
		private readonly docDaoService: DocDaoService,
		private readonly dataSource: DataSource,
		private readonly packageDaoService: PackageDaoService,
		private readonly reportingRequestDaoService: ReportingDaoService,
		private readonly mongoDaoService: MongoDaoService,
		private readonly userDaoService: UserDaoService
	) {}

	async fetchPlaidData() {
		const dataFetchPendingStatus = [
			MonthlyProofStatusEnum.DATA_FETCH_PENDING,
			MonthlyProofStatusEnum.PARTIALLY_APPROVED,
			MonthlyProofStatusEnum.QUALIFIED,
			MonthlyProofStatusEnum.REQUESTED
		];
		const plaidData = await this.monthlyDocDaoService.getPlaidMonthlyProofDataByStatusAndMonthlyProofType(
			dataFetchPendingStatus,
			MonthlyProofTypeEnum.TRANSACTION
		);

		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			for (let plaid of plaidData) {
				const monthlyProofData = await this.monthlyDocDaoService.getmonthlyProofDocById(plaid.monthlyProofId);
				try {
					let modifiedStartDate;
					// = this.commonUtilityService.modifiedDateTimeForPlaid(
					// 	this.commonUtilityService.getPreviousConsecutiveDate(new Date(), 30)
					// );
					const { dueDate, paymentDueDate } =
						await this.monthlyDocDaoService.getPaymentScheduleAmountByMonthAndYear(
							plaid.refdocId,
							plaid.reportingMonth,
							plaid.reportingYear
						);
					const currentDate = new Date();

					const endDate = new Date(new Date(currentDate).setDate(new Date(currentDate).getDate() - 1));

					const modifiedEndDate = this.commonUtilityService.modifiedDateTimeForPlaid(endDate);
					if (plaid.lastFetchDate) {
						modifiedStartDate = this.commonUtilityService.modifiedDateTimeForPlaid(plaid.lastFetchDate);
					} else {
						const startDate = new Date(new Date(dueDate).setDate(new Date(dueDate).getDate() - 15));

						modifiedStartDate = this.commonUtilityService.modifiedDateTimeForPlaid(startDate);
					}
					if (modifiedEndDate < modifiedStartDate) continue;
					const txns: Transaction[] = await this.plaidService.getUserPlaidAccountTransactions(
						plaid.accessToken,
						modifiedStartDate,
						modifiedEndDate,
						plaid.proofIdValue
					);
					const plaidMongoTxns = this.monthlyProofHelperService.createProofDetail(
						txns,
						monthlyProofData.id,
						paymentDueDate,
						dueDate
					);
					await this.mongoDaoService.saveMongoPlaidData(plaidMongoTxns);
					if (
						plaidMongoTxns.length &&
						monthlyProofData.status !== MonthlyProofStatusEnum.PARTIALLY_APPROVED &&
						monthlyProofData.status !== MonthlyProofStatusEnum.QUALIFIED
					) {
						monthlyProofData.status = MonthlyProofStatusEnum.REQUESTED;
					}
					monthlyProofData.updatedAt = new Date();
					monthlyProofData.lastFetchDate = currentDate;
					await this.monthlyDocDaoService.saveMonthlyProofDocFromQueryRunner(queryRunner, monthlyProofData);
				} catch (err) {
					const appLoggerDto: AppLoggerDto = new AppLoggerDto(
						VariablesConstant.ERROR,
						"FETCH_PLAID_DATA_EXPRESSION_ERROR",
						"monthly-proof.module",
						"MonthlyProofService",
						"getPlaidData",
						err
					);
					appLoggerDto.addData("monthly proof:", JSON.stringify(monthlyProofData));
					this.appLoggerService.writeLog(appLoggerDto);
					monthlyProofData.status = MonthlyProofStatusEnum.INACTIVE;
					monthlyProofData.lastFetchDate = new Date();
					await this.monthlyDocDaoService.saveMonthlyProofDocFromQueryRunner(queryRunner, monthlyProofData);
					const masterProof = await this.docDaoService.getMasterProofByMasterProofId(
						monthlyProofData.masterProofId
					);
					masterProof.updateStatus(ProofStatus.PLAID_ISSUE);
					await this.docDaoService.saveValidationDocMasterDataByQueryRunner(masterProof, queryRunner);
				}
			}
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	@Cron(`${process.env.FETCH_PLAID_DATA_EXPRESSION}`)
	async getPlaidData() {
		let flag = await this.schedulerHelperService.checkAndUpdateSchedulerRunningStatus("FETCH_PLAID_DATA_EXPRESSION");
		if (!flag) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.INFO,
				"Scheduler Already Running - FETCH_PLAID_DATA_EXPRESSION",
				"monthly-proof.module",
				"MonthlyProofService",
				"getPlaidData",
				null
			);
			this.appLoggerService.writeLog(appLoggerDto);
			return;
		}
		await this.fetchPlaidData();

		await this.schedulerHelperService.updateSchedulerRunningStatus("FETCH_PLAID_DATA_EXPRESSION", 0);
	}

	@Cron(`${process.env.MONTHLY_PROOF_INSERTION_EXPRESSION}`)
	async inserrMonthlyProofs() {
		let flag = await this.schedulerHelperService.checkAndUpdateSchedulerRunningStatus(
			"MONTHLY_PROOF_INSERTION_EXPRESSION"
		);
		if (!flag) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.INFO,
				"Scheduler Already Running - MONTHLY_PROOF_INSERTION_EXPRESSION",
				"monthly-proof.module",
				"MonthlyProofService",
				"inserrMonthlyProofs",
				null
			);
			this.appLoggerService.writeLog(appLoggerDto);
			return;
		}
		try {
			await this.updateMontlyProofData();
		} catch (err) {
			throw new HttpException({ data: {}, status: ResponseData.MONTHLY_PROOF_INSERTION_ERROR }, HttpStatus.OK);
		}

		await this.schedulerHelperService.updateSchedulerRunningStatus("MONTHLY_PROOF_INSERTION_EXPRESSION", 0);
	}

	async updateMontlyProofData() {
		const monthlyProofUploadingTime = this.configService.get("MONTHLY_PROOF_UPLOADING_TIME");
		const monthlyProofUploadEndDate = this.commonUtilityService.getDateOfDaysFromToday(+monthlyProofUploadingTime);
		const monthlyProofUploadStartDate = this.commonUtilityService.modifiedDateTime(new Date());
		const paymentScheduleData = await this.docDaoService.getPaymentScheduleForRentDueData(
			monthlyProofUploadStartDate,
			monthlyProofUploadEndDate,
			PaymentScheduleStatus.NEW
		);
		if (!paymentScheduleData.length) return;
		const paymentScheduleArr: PaymentSchedule[] = [];
		const paymentScheduleIdsArr: number[] = [];
		paymentScheduleData.forEach((paymentSchedule) => {
			paymentSchedule.status = PaymentScheduleStatus.DUE;
			paymentScheduleArr.push(paymentSchedule);
			paymentScheduleIdsArr.push(paymentSchedule.id);
		});
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			await this.docDaoService.savePaymentSchedule(paymentScheduleArr, queryRunner);
			await this.docDaoService.updateUserPaymentScheduleByRefScheduleIds(
				paymentScheduleIdsArr,
				UserPaymentScheduleStatus.DUE,
				queryRunner
			);
			const refdocReportingDurationMapping = {};
			const refdocIds = paymentScheduleData.map((paymentSchedule) => {
				refdocReportingDurationMapping[paymentSchedule.leaseId] = {
					dueDate: paymentSchedule.dueDate,
					paymentDueDate: paymentSchedule.paymentDueDate
				};
				return paymentSchedule.leaseId;
			});

			const refdocs = await this.docDaoService.getRefdocDataByRefdocIds(refdocIds);
			refdocs.forEach((refdoc) => {
				refdoc.rentDueDate = refdocReportingDurationMapping[refdoc.refdocId].dueDate;
				refdoc.rentPaymentDueDate = refdocReportingDurationMapping[refdoc.refdocId].paymentDueDate;
			});
			await this.docDaoService.saveMultipleRefdocMastersByQueryRunner(queryRunner, refdocs);
			const masterProofDetails = await this.docDaoService.getMasterProofDataByRefdocIdsAndMasterProofType(
				refdocIds,
				ProofStatus.APPROVED,
				MasterProofTypeEnum.PLAID
			);
			const montlyProofData: ValidationDocMonthlyProof[] = [];
			for (const masterProof of masterProofDetails) {
				const monthlyProof: ValidationDocMonthlyProof = new ValidationDocMonthlyProof(
					masterProof.userId,
					masterProof.id,
					masterProof.monthlyProofType,
					0,
					this.commonUtilityService.getFirstDateOfMonth(
						refdocReportingDurationMapping[masterProof.refdocId].dueDate
					),
					masterProof.monthlyProofType === MonthlyProofTypeEnum.RECEIPT
						? MonthlyProofStatusEnum.UPLOAD_PENDING
						: MonthlyProofStatusEnum.DATA_FETCH_PENDING
				);
				const { month, year } = this.commonUtilityService.getMonthAndYearFromDate(
					refdocReportingDurationMapping[masterProof.refdocId].dueDate
				);

				const dueDate = new Date(refdocReportingDurationMapping[masterProof.refdocId].dueDate);
				const nextMonthDueDate = this.commonUtilityService.getLastDateOfMonth(dueDate);
				monthlyProof.fetchTill = new Date(nextMonthDueDate);
				const monthName = MonthMapEnum[month.toString()];
				monthlyProof.updateRefdocDueDates(monthName, year);
				montlyProofData.push(monthlyProof);
			}
			if (montlyProofData.length) {
				await this.monthlyDocDaoService.insertMonthlyProofDetailsByQueryRunner(montlyProofData, queryRunner);
			}
			await this.insertReportingRequestData(paymentScheduleArr, queryRunner);
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	async insertReportingRequestData(paymentSchedules: PaymentSchedule[], queryRunner: QueryRunner) {
		for (let paymentSchedule of paymentSchedules) {
			const subscriptionTxns = await this.packageDaoService.getSubscriptionTxnsByMonthYearAndRefdocId(
				paymentSchedule.month,
				paymentSchedule.year,
				paymentSchedule.leaseId,
				PaymentStatusEnum.PAYMENT_DONE
			);
			if (subscriptionTxns.length)
				await this.addReportingRequestDataForPaidSuscription(paymentSchedule.id, subscriptionTxns, queryRunner);
		}
	}

	async addReportingRequestDataForPaidSuscription(
		paymentScheduleId: number,
		subscriptionTxns: UserSubscriptionTransactions[],
		queryRunner: QueryRunner
	) {
		const reportingRequests: UserCreditReportingRequests[] = [];
		for (let subscription of subscriptionTxns) {
			const userPaymentSchedule = await this.docDaoService.getUserPaymentScheduleByRefScheduleIdAndUserId(
				subscription.benificiaryUserId,
				paymentScheduleId,
				queryRunner
			);
			if (!userPaymentSchedule) return;
			const userReportingRequest = new UserCreditReportingRequests(
				subscription.benificiaryUserId,
				userPaymentSchedule.id,
				subscription.refdocId,
				ReportingStatus.AMOUNT_DUE
			);
			reportingRequests.push(userReportingRequest);
		}
		if (reportingRequests.length)
			await this.reportingRequestDaoService.saveMultipleReportingRequest(reportingRequests, queryRunner);
	}

	async fetchLookBackPlaidData() {
		const plaidData = await this.monthlyDocDaoService.getPlaidMonthlyProofDataForLookBack(
			MonthlyProofStatusEnum.LOOKBACK_DATE_FETCH_PENDING
		);
		const queryRunner = this.dataSource.createQueryRunner();
		for (let plaid of plaidData) {
			const monthlyProofData = await this.monthlyDocDaoService.getmonthlyProofDocById(plaid.monthlyProofId);
			try {
				await queryRunner.connect();
				await queryRunner.startTransaction();
				const { id, dueDate, paymentDueDate } =
					await this.monthlyDocDaoService.getPaymentScheduleAmountByMonthAndYear(
						plaid.refdocId,
						plaid.reportingMonth,
						plaid.reportingYear
					);
				const nextPaymentSchedule = await this.monthlyDocDaoService.getNextPaymentScheduleAfterDueDate(
					plaid.refdocId,
					dueDate
				);
				const userPaymentSchedule = await this.docDaoService.getUserPaymentScheduleByRefScheduleIdAndUserId(
					monthlyProofData.userId,
					id,
					queryRunner
				);
				userPaymentSchedule.status = UserPaymentScheduleStatus.DATA_NOT_FOUND;
				const startDate = this.commonUtilityService.modifiedDateTimeForPlaid(
					new Date(dueDate.setDate(dueDate.getDate() - 15))
				);
				let modifiedEndDate;
				if (nextPaymentSchedule) {
					const newDate = new Date(nextPaymentSchedule.dueDate);
					const endDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate() - 1);
					modifiedEndDate = this.commonUtilityService.modifiedDateTimeForPlaid(endDate);
				} else {
					const nextDate = new Date(dueDate);
					const nextMonthDueDate = new Date(
						nextDate.getFullYear(),
						nextDate.getMonth() + 1,
						nextDate.getDate() - 1
					);
					modifiedEndDate = this.commonUtilityService.modifiedDateTimeForPlaid(nextMonthDueDate);
				}
				const txns: Transaction[] = await this.plaidService.getUserPlaidAccountTransactions(
					plaid.accessToken,
					startDate,
					modifiedEndDate,
					plaid.proofIdValue
				);
				monthlyProofData.status = MonthlyProofStatusEnum.DATA_NOT_FOUND;
				const plaidMongoTxns = this.monthlyProofHelperService.createProofDetail(
					txns,
					monthlyProofData.id,
					paymentDueDate,
					dueDate
				);
				if (plaidMongoTxns.length) {
					monthlyProofData.status = MonthlyProofStatusEnum.REQUESTED;
					await this.mongoDaoService.saveMongoPlaidData(plaidMongoTxns);
				}
				monthlyProofData.updatedAt = new Date();
				monthlyProofData.lastFetchDate = new Date();
				await this.monthlyDocDaoService.saveMonthlyProofDoc(monthlyProofData);
				await queryRunner.commitTransaction();
			} catch (err) {
				await queryRunner.rollbackTransaction();
				const appLoggerDto: AppLoggerDto = new AppLoggerDto(
					VariablesConstant.ERROR,
					"FETCH_LOOKBACK_PLAID_DATA_EXPRESSION_ERROR",
					"monthly-proof.module",
					"MonthlyProofSchedularService",
					"fetchLookBackPlaidData",
					err
				);
				appLoggerDto.addData("monthly proof:", JSON.stringify(monthlyProofData));
				this.appLoggerService.writeLog(appLoggerDto);
				monthlyProofData.status = MonthlyProofStatusEnum.INACTIVE;
				monthlyProofData.lastFetchDate = new Date();
				await this.monthlyDocDaoService.saveMonthlyProofDoc(monthlyProofData);
				const masterProof = await this.docDaoService.getMasterProofByMasterProofId(monthlyProofData.masterProofId);
				masterProof.updateStatus(ProofStatus.PLAID_ISSUE);
				await this.docDaoService.saveValidationDocMasterData(masterProof);
			}
		}
	}

	async verifyPlaidTransactions() {
		const plaidTxns = await this.mongoDaoService.getMongoPlaidDataByStatus(PlaidTxnStatus.NEW);
		if (plaidTxns.length) {
			const monthlyProofIds = [];
			const monthlyProofRefdocParticipantObj = {};
			await this.monthlyProofHelperService.createMonthlyProofRefdocParticipantObj(
				plaidTxns,
				monthlyProofIds,
				monthlyProofRefdocParticipantObj
			);
			const paymentSchedules = await this.monthlyDocDaoService.getPaymentScheduleByMonthlyProofIds(monthlyProofIds);
			const monthlyProofAmountObj = {};
			paymentSchedules.forEach((schedule) => {
				monthlyProofAmountObj[schedule.monthlyProofId] = schedule.amount;
			});
			const userInfo = await this.userDaoService.getUserInfoByRefdocId(paymentSchedules[0].leaseId);
			const configs = await this.configurationService.getBusinessConfigurations(userInfo?.businessId);
			const requiredConfidenceScore = configs.get(ConfigCodeEnum.CONFIDENCE_SCORE);
			const nonCreditorDataObj = {};
			await this.monthlyProofHelperService.createNonCreditorDataObj(requiredConfidenceScore, nonCreditorDataObj);
			const unfilteredPlaidTxns: MongoPlaidData[] = [];
			const filteredPlaidTxns = this.monthlyProofHelperService.filterPlaidTxns(
				plaidTxns,
				monthlyProofRefdocParticipantObj,
				monthlyProofAmountObj,
				unfilteredPlaidTxns
			);

			const creditorData = await this.monthlyDocDaoService.getCreditorByMonthlyProofId(monthlyProofIds);
			const creditorDataObj = {};
			creditorData.forEach((creditor) => {
				if (creditor.creditors) {
					creditorDataObj[creditor.monthlyProofId] = JSON.parse(creditor.creditors);
				}
			});
			const monthlyProofArr = [];
			await this.monthlyProofHelperService.verifyPlaidTxnsAndCreateMonthlyProof(
				filteredPlaidTxns,
				nonCreditorDataObj,
				creditorDataObj,
				monthlyProofArr
			);
			const queryRunner = this.dataSource.createQueryRunner();
			try {
				await queryRunner.connect();
				await queryRunner.startTransaction();
				await this.monthlyDocDaoService.updateMonthlyDocProofDetailsByQueryRunner(monthlyProofArr, queryRunner);
				await this.mongoDaoService.saveMongoPlaidData(filteredPlaidTxns);
				await this.mongoDaoService.saveMongoPlaidData(unfilteredPlaidTxns);
				await queryRunner.commitTransaction();
			} catch (error) {
				await queryRunner.rollbackTransaction();
				const appLoggerDto: AppLoggerDto = new AppLoggerDto(
					VariablesConstant.ERROR,
					"VERIFY_PLAID_TXN_EXPRESSION",
					"monthly-proof.module",
					"MonthlyProofSchedularService",
					"VerifyPlaidTxns",
					error
				);
				this.appLoggerService.writeLog(appLoggerDto);
			} finally {
				await queryRunner.release();
			}
		}
	}

	async handleQualifiedMonthlyProofs() {
		const qualifiedMonthlyProofs = await this.monthlyDocDaoService.getMonthlyProofByStatus(
			MonthlyProofStatusEnum.QUALIFIED
		);
		for (const monthlyProof of qualifiedMonthlyProofs) {
			const masterProofData = await this.docDaoService.getMasterProofByMasterProofId(monthlyProof.masterProofId);
			const refdocId = masterProofData.refdocId;

			let transactionIds = [];
			let { mongoPlaidTxns, proofDetailObj, txnIdToDataMapping } =
				await this.monthlyProofHelperService.getTransactionIdsForQualifiedProofs(monthlyProof, transactionIds);

			const queryRunner = this.dataSource.createQueryRunner();
			try {
				await queryRunner.connect();
				await queryRunner.startTransaction();
				await this.monthlyProofHelperService.updateVerifiedMonthlyProofs(
					monthlyProof,
					proofDetailObj,
					transactionIds,
					queryRunner,
					refdocId,
					masterProofData,
					txnIdToDataMapping
				);
				const newPaymentScheduleStatus =
					await this.monthlyProofHelperService.updatePaymentScheduleStatusByQueryRunner(
						monthlyProof,
						refdocId,
						monthlyProof.amount,
						queryRunner,
						txnIdToDataMapping
					);
				monthlyProof.status = MonthlyProofStatusEnum.APPROVED;
				await this.monthlyProofHelperService.updateMonthlyProofForQualiffiedProofs(
					newPaymentScheduleStatus,
					refdocId,
					monthlyProof,
					mongoPlaidTxns,
					queryRunner
				);
				await this.monthlyDocDaoService.saveMonthlyProofDocFromQueryRunner(queryRunner, monthlyProof);
				await queryRunner.commitTransaction();
			} catch (error) {
				await queryRunner.rollbackTransaction();
				const appLoggerDto: AppLoggerDto = new AppLoggerDto(
					VariablesConstant.ERROR,
					"VERIFY_PLAID_TXN_EXPRESSION",
					"monthly-proof.module",
					"MonthlyProofSchedularService",
					"HandleQualifiedProofs",
					error
				);
				this.appLoggerService.writeLog(appLoggerDto);
			} finally {
				await queryRunner.release();
			}
		}
	}

	@Cron(`${process.env.HANDLE_QUALIFIED_MONTHLYPROOFS_EXPRESSION}`)
	async handleMonthlyProofsQualified() {
		let flag = await this.schedulerHelperService.checkAndUpdateSchedulerRunningStatus(
			"HANDLE_QUALIFIED_MONTHLYPROOFS_EXPRESSION"
		);
		if (!flag) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.INFO,
				"Scheduler Already Running - HANDLE_QUALIFIED_MONTHLYPROOFS_EXPRESSION",
				"monthly-proof.module",
				"MonthlyschedularService",
				"handleQualifiedMonthlyProofs",
				null
			);
			this.appLoggerService.writeLog(appLoggerDto);
			return;
		}
		await this.handleQualifiedMonthlyProofs();

		await this.schedulerHelperService.updateSchedulerRunningStatus("HANDLE_QUALIFIED_MONTHLYPROOFS_EXPRESSION", 0);
	}

	@Cron(`${process.env.VERIFY_PLAID_TXN_EXPRESSION}`)
	async verifyPlaidTxns() {
		let flag = await this.schedulerHelperService.checkAndUpdateSchedulerRunningStatus("VERIFY_PLAID_TXN_EXPRESSION");
		if (!flag) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.INFO,
				"Scheduler Already Running - VERIFY_PLAID_TXN_EXPRESSION",
				"monthly-proof.module",
				"MonthlyschedularService",
				"verifyPlaidTxns",
				null
			);
			this.appLoggerService.writeLog(appLoggerDto);
			return;
		}
		await this.verifyPlaidTransactions();

		await this.schedulerHelperService.updateSchedulerRunningStatus("VERIFY_PLAID_TXN_EXPRESSION", 0);
	}
}
