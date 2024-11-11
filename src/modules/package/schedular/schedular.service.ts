import { PackageDaoService } from "@modules/dao/package-dao/package-dao.service";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { StripePaymentInitiateDto } from "../dto/stripe-initiate.dto";
import { UserSubscriptionTransactions } from "../entities/user-subscription-txn.entity";
import { UserDaoService } from "@modules/dao/user-dao/user-dao.service";
import { ExternalUrlsService } from "@utils/constants/urls";
import * as cheerio from "cheerio";
import { ConfigService } from "src/config";
import { MongoCashierApisEntity } from "@modules/mongo/entities/MongoCashierApisEntity";
import { MongoService } from "@modules/mongo/mongo.service";
import VariablesConstant from "@utils/variables-constant";
import { PaymentStatusEnum, SubscriptionPaymentTypeEnum, YesNoEnum } from "@utils/enums/Status";
import { DepostiDataDto } from "../dto/deposit-data.dto";
import { ExternalApiCallService } from "@utils/common/external-api-call/external-api-call.service";
import { AliasDaoService } from "@modules/dao/alias-dao/alias-dao.service";
import { CommonUtilityService } from "@utils/common/common-utility/common-utility.service";
import { PackageService } from "../package.service";
import { AppLoggerDto } from "@app-logger/app-logger.dto";
import { AppLoggerService } from "@app-logger/app-logger.service";
import { SchedulerHelperService } from "@utils/common/scheduler-helper/scheduler-helper.service";
import { MonthMapEnum } from "@utils/constants/map-month-constants";
import { ResponseData } from "@utils/enums/response";
import { CashierStatusEnum } from "@utils/enums/constants";
import { DataSource, QueryRunner } from "typeorm";
import { DocDaoService } from "@modules/dao/doc-dao/doc-dao.service";
import { ReportingDaoService } from "@modules/dao/reporting-dao/reporting-dao.service";
import {
	ReportingStatus,
	UserCreditReportingRequests
} from "@modules/reporting/entities/user-credit-reporting-request.entity";
import { UserPaymentScheduleStatus } from "@modules/doc/entities/user-payment-schedule.entity";
require("dotenv").config();
@Injectable()
export class PackageSchedularService {
	constructor(
		private readonly packageDaoService: PackageDaoService,
		private readonly userDaoService: UserDaoService,
		private readonly configService: ConfigService,
		private readonly mongoService: MongoService,
		private readonly externalUrlsService: ExternalUrlsService,
		private readonly externalApiCallService: ExternalApiCallService,
		private readonly aliasDaoService: AliasDaoService,
		private readonly commonUtilityService: CommonUtilityService,
		private readonly packageService: PackageService,
		private readonly appLoggerService: AppLoggerService,
		private readonly schedulerHelperService: SchedulerHelperService,
		private readonly dataSource: DataSource,
		private readonly docDaoService: DocDaoService,
		private readonly reportingRequestDaoService: ReportingDaoService
	) {}

	@Cron(`${process.env.STRIPE_AUTO_DEBIT_EXPRESSION}`)
	async stripeAutoDebitPayments() {
		let flag = await this.schedulerHelperService.checkAndUpdateSchedulerRunningStatus("STRIPE_AUTO_DEBIT_EXPRESSION");
		if (!flag) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.INFO,
				"Scheduler Already Running - STRIPE_AUTO_DEBIT_EXPRESSION",
				"package",
				"PackageSchedularService",
				"stripeAutoDebitPayments",
				null
			);
			this.appLoggerService.writeLog(appLoggerDto);
			return;
		}
		await this.stripeAutoDebit();
		await this.schedulerHelperService.updateSchedulerRunningStatus("STRIPE_AUTO_DEBIT_EXPRESSION", 0);
	}

	@Cron(`${process.env.STRIPE_AUTO_DEBIT_REQUERY_EXPRESSION}`)
	async stripeAutoDebitPaymentsRequery() {
		let flag = await this.schedulerHelperService.checkAndUpdateSchedulerRunningStatus(
			"STRIPE_AUTO_DEBIT_REQUERY_EXPRESSION"
		);
		if (!flag) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.INFO,
				"Scheduler Already Running - STRIPE_AUTO_DEBIT_REQUERY_EXPRESSION",
				"package",
				"PackageSchedularService",
				"stripeAutoDebitPaymentsRequery",
				null
			);
			this.appLoggerService.writeLog(appLoggerDto);
			return;
		}
		await this.stripeAutoDebitRequery();
		await this.schedulerHelperService.updateSchedulerRunningStatus("STRIPE_AUTO_DEBIT_REQUERY_EXPRESSION", 0);
	}

	async stripeAutoDebit() {
		const currentDate = new Date();
		const currentMonthDate = new Date(this.commonUtilityService.getFirstDateOfMonth(currentDate));
		const dateFormat = "YYYY-MM-DD";
		const formattedCurrentDate = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			currentDate,
			dateFormat
		);
		const formattedCurrentMonthDate = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			currentMonthDate,
			dateFormat
		);
		const getTodaySubscriptions = await this.packageDaoService.getAutoRenewalSubscriptionsForDate(
			formattedCurrentDate,
			formattedCurrentMonthDate
		);
		for (let transaction of getTodaySubscriptions) {
			await this.initiatePackagePayment(transaction);
		}
	}

	async initiatePackagePayment(transaction: UserSubscriptionTransactions) {
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			const packageData = await this.packageDaoService.getPackageById(transaction.packageId);
			if (packageData.autoRenew === YesNoEnum.NO) {
				throw new HttpException({ status: ResponseData.PACKAGE_AUTO_RENEW_NOT_ALLOWED }, HttpStatus.OK);
			}
			await this.checkPendingTxn(transaction.id);
			const userInfo = await this.userDaoService.getUserInfoByUserId(transaction.userId);
			const aliasInfo = await this.aliasDaoService.getAliasDataByUserId(transaction.userId);
			let renewalDate = this.commonUtilityService.getPackageRenewalDate(1);
			let validTill = this.packageService.getLastDateOfMonth(1);
			const renewalData = this.commonUtilityService.getMonthAndYearFromDate(transaction.renewalMonth);
			const newTxn = new UserSubscriptionTransactions(
				packageData.packageId,
				transaction.userId,
				transaction.benificiaryUserId,
				new Date(renewalDate),
				true,
				packageData.firstUnitPrice,
				packageData.firstUnitPrice
			);
			newTxn.addSubscriptionTransactionDetails(
				validTill,
				PaymentStatusEnum.PURCHASE_INITIATED,
				transaction.refdocId,
				SubscriptionPaymentTypeEnum.AUTO_DEBIT_SUBSCRIPTION,
				transaction.paymentMethodId,
				null
			);
			newTxn.updateReferenceSubscriptionId(transaction.id);
			newTxn.updateSubscriptionMonthAndYear(MonthMapEnum[renewalData.month], renewalData.year);
			await this.packageDaoService.createUserSubscriptionTxn(newTxn);
			const depositData: DepostiDataDto = new DepostiDataDto(
				transaction.paymentMethodId,
				packageData.name,
				packageData.packageId.toString(),
				transaction.benificiaryUserId.toString(),
				transaction.refdocId.toString(),
				SubscriptionPaymentTypeEnum.AUTO_DEBIT_SUBSCRIPTION
			);
			const stripePaymentInitiateData: StripePaymentInitiateDto = new StripePaymentInitiateDto(
				packageData.firstUnitPrice,
				userInfo.currencyCode,
				encodeURIComponent(JSON.stringify(depositData)),
				this.configService.get("STRIPE_DEVICE_TYPE").toString(),
				aliasInfo.aliasName,
				this.configService.get("STRIPE_PAYMENT_TYPE_CODE").toString()
			);
			stripePaymentInitiateData.addStripeDetails(
				+this.configService.get("STRIPE_SUB_TYPE_ID"),
				this.configService.get("STRIPE_TXN_TYPE").toString(),
				this.configService.get("STRIPE_USER_AGENT").toString(),
				+this.configService.get("STRIPE_PAYMENT_TYPE_ID"),
				+userInfo.systemUserId
			);
			stripePaymentInitiateData.addIsFromClient(true);
			stripePaymentInitiateData.updateSaleRefNo(newTxn.id);
			const headers = {
				actionType: this.configService.get("STRIPE_ACTION_TYPE").toString(),
				aliasName: aliasInfo.aliasName
			};
			let params = stripePaymentInitiateData;
			let url: any = this.externalUrlsService.cashierStripeUrl + "?";
			Object.keys(stripePaymentInitiateData).forEach((key) => {
				if (key === "consumerToken") {
					return;
				}
				let param = `${key}=${stripePaymentInitiateData[key]}&`;
				url += param;
			});
			url = url.slice(0, -1);

			let mongoCashierApisEntity: MongoCashierApisEntity = null;
			if (`${this.configService.get("IS_MONGO_ENABLE")}` == "true") {
				mongoCashierApisEntity = new MongoCashierApisEntity(url, headers, params, null, "PAYMENT", "Stripe_payment");
			}
			const htmlResponse = await this.externalApiCallService.postReq(headers, null, url);
			setImmediate(() => {
				this.mongoService.mongoLogging(
					params,
					mongoCashierApisEntity,
					VariablesConstant.CASHIER_API_MONGO_ENTITY,
					htmlResponse,
					new Date()
				);
			});
			const $ = cheerio.load(htmlResponse);
			const responseJson = $('input[name="responseJson"]').attr("value");
			const stripeResponse = JSON.parse(responseJson);
			if (stripeResponse?.errorCode?.toString() === "0") {
				if (stripeResponse?.status === CashierStatusEnum.DONE) {
					newTxn.updateSubscriptionStatus(PaymentStatusEnum.PAYMENT_DONE);
					newTxn.updateReferenceId(stripeResponse?.providerTxnId);
					await this.packageDaoService.updateUserSubcriptionAutoRenewalQueryRunner(
						transaction.benificiaryUserId,
						transaction.refdocId,
						newTxn.id,
						false,
						queryRunner
					);
					await this.addReportingRequestAfterStripeAutoDebit(newTxn, queryRunner);
				} else if (stripeResponse?.status === CashierStatusEnum.FAILED) {
					newTxn.updateSubscriptionStatus(PaymentStatusEnum.PAYMENT_FAILED);
				}
			} else {
				newTxn.updateSubscriptionStatus(PaymentStatusEnum.PAYMENT_FAILED);
			}
			await this.packageDaoService.createUserSubscriptionTxnByQueryRunner(newTxn, queryRunner);
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"stripe_auto_debit_txn_error",
				"package",
				"PackageSchedularService",
				"initiatePackagePayment",
				error
			);
			this.appLoggerService.writeLog(appLoggerDto);
		} finally {
			await queryRunner.release();
		}
	}

	async checkPendingTxn(referenceSubscriptionId: number) {
		const pendingSubscription = await this.packageDaoService.getReferenceSubsciptionByStatus(
			referenceSubscriptionId,
			PaymentStatusEnum.PURCHASE_INITIATED
		);
		if (pendingSubscription) {
			throw new HttpException({ status: ResponseData.SUBSCRIPTION_ALREADY_IN_PROCESS }, HttpStatus.OK);
		}
	}

	async stripeAutoDebitRequery() {
		const time = new Date();
		time.setMinutes(time.getMinutes() - 5);
		const formattedDate = CommonUtilityService.getModifiedDate(time);
		const paymentInitiatedTxns = await this.packageDaoService.getPaymentInitiatedTxns(formattedDate);
		for (let transaction of paymentInitiatedTxns) {
			await this.checkPaymentStatus(transaction);
		}
	}

	async checkPaymentStatus(transaction: UserSubscriptionTransactions) {
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			const headers = {
				clientCode: this.configService.get("CASHIER_CLIENT_CODE").toString(),
				clientPwd: this.configService.get("CASHIER_CLIENT_PASSWORD").toString()
			};

			let queryParam = {
				providerCode: this.configService.get("STRIPE_PROVIDER_CODE").toString(),
				crsTransactionId: transaction.id
			};
			const url: any = this.externalUrlsService.cashierStripeRequeryUrl;
			const result = await this.externalApiCallService.getReq(url, queryParam, headers);
			if (result?.errorCode?.toString() === "0") {
				const response = result.data;
				if (response.status === CashierStatusEnum.DONE) {
					transaction.updateSubscriptionStatus(PaymentStatusEnum.PAYMENT_DONE);
					transaction.updateReferenceId(response.id);
					await this.packageDaoService.updateUserSubcriptionAutoRenewalQueryRunner(
						transaction.benificiaryUserId,
						transaction.refdocId,
						transaction.id,
						false,
						queryRunner
					);
					await this.addReportingRequestAfterStripeAutoDebit(transaction, queryRunner);
				} else if (response.status === CashierStatusEnum.FAILED) {
					transaction.updateSubscriptionStatus(PaymentStatusEnum.PAYMENT_FAILED);
				}
			} else if (
				result?.errorCode?.toString() === this.configService.get("STRIPE_PAYMENT_FAILED_ERROR_CODE").toString()
			) {
				transaction.updateSubscriptionStatus(PaymentStatusEnum.PAYMENT_FAILED);
			} else {
				const appLoggerDto: AppLoggerDto = new AppLoggerDto(
					VariablesConstant.ERROR,
					"stripe_auto_debit_txn_requery_error",
					"package",
					"PackageSchedularService",
					"checkPaymentStatus",
					result
				);
				this.appLoggerService.writeLog(appLoggerDto);
			}
			await this.packageDaoService.createUserSubscriptionTxnByQueryRunner(transaction, queryRunner);
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"stripe_auto_debit_txn_requery_error",
				"package",
				"PackageSchedularService",
				"checkPaymentStatus",
				error
			);
			this.appLoggerService.writeLog(appLoggerDto);
		} finally {
			await queryRunner.release();
		}
	}

	async addReportingRequestAfterStripeAutoDebit(subscriptionTxn: UserSubscriptionTransactions, queryRunner: QueryRunner) {
		const { subscriptionMonth, subscriptionYear, benificiaryUserId, refdocId } = subscriptionTxn;
		const userSchedule = await this.docDaoService.getUserPaymentScheduleForMonthYearRefdocIdAndStatus(
			subscriptionMonth,
			subscriptionYear,
			benificiaryUserId,
			refdocId,
			queryRunner,
			UserPaymentScheduleStatus.DUE
		);
		if (!userSchedule) return;
		const userReportingRequest = new UserCreditReportingRequests(
			benificiaryUserId,
			userSchedule.id,
			refdocId,
			ReportingStatus.AMOUNT_DUE
		);
		await this.reportingRequestDaoService.saveReportingRequest(userReportingRequest, queryRunner);
	}
}
