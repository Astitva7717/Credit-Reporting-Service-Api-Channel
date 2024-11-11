import { MonthlyDocDaoService } from "@modules/dao/monthly-doc-dao/monthly-doc-dao.service";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { MonthlyProofTypeEnum } from "@utils/enums/txn-types";
import { CommonUtilityService } from "@utils/common/common-utility/common-utility.service";
import { GetMontlyProofDto } from "./dto/get-monthly-proofs.dto";
import { ApproveMonthlyProofDto } from "./dto/approve-monthly-proof.dto";
import VariablesConstant from "@utils/variables-constant";
import { ResponseData } from "@utils/enums/response";
import { SaveMonthlyProofDto } from "./dto/save-monthly-proof.dto";
import { GetMontlyProofFullDetailsDto } from "./dto/monthly-proof-full-details.dto";
import { MonthlyProofsDto, TypeEnum } from "./dto/monthly-proofs.dto";
import { MonthMapEnum } from "@utils/constants/map-month-constants";
import { ConfigurationService } from "@utils/configuration/configuration.service";
import { ConfigCodeEnum } from "@utils/enums/constants";
import { MonthlyProofHelperService } from "./monthly-Proof-helper/monthlyProof-helper.service";
import { MonthlyProofStatusEnum, Status, VerifiedProofStatusEnum } from "@utils/enums/Status";
import { ValidationDocMonthlyProof } from "./entities/validation-doc-monthly-proof.entity";
import { DocDaoService } from "@modules/dao/doc-dao/doc-dao.service";
import { ProofStatus } from "@modules/doc/entities/validation-doc-master-proof.entity";
import { DisputeDaoService } from "@modules/dao/dispute-dao/dispute-dao.service";
import { UserDaoService } from "@modules/dao/user-dao/user-dao.service";
import { AliasDaoService } from "@modules/dao/alias-dao/alias-dao.service";
import { KafkaEventTypeEnum } from "@kafka/dto/kafka-event-message.dto";
import { ScreenNames } from "@utils/enums/communication-enums";
import { DataSource } from "typeorm";
import { PaymentSchedule } from "@modules/doc/entities/payment-schedule.entity";
import { RejectPlaidDto } from "./dto/reject-plaid-transaction.dto";
import { MongoDaoService } from "@modules/dao/mongo-dao/mongo-dao.service";
import { MonthMatchingStatus, PlaidTxnStatus } from "@modules/mongo/entities/mongoPlaidDataEntity";
import { CreditorDropdownDto } from "./dto/creditor-dropdown-dto";
import { QualifyPlaidTxnsDto } from "./dto/qualify-plaid-txns.dto";
import { GetCreditorPayPlaidDataDto } from "./dto/get-creditor-pay-plaid.dto";
import { GetCreditorPayPlaidDetailsDto } from "./dto/get-creditor-pay-plaid-details.dto";
import { GetPlaidTxnsDto } from "./dto/get-plaid-txns.dto";
import { RejectSelectedPlaidTxnDto } from "./dto/reject-selected-plaid-txn.dto";
import { PackageDaoService } from "@modules/dao/package-dao/package-dao.service";
import { AssignMonthDto } from "./dto/assign-month-dto";
import { DocHelperService } from "@modules/doc/doc-helper/doc-helper.service";

@Injectable()
export class MonthlyProofService {
	constructor(
		private monthlyDocDaoService: MonthlyDocDaoService,
		private commonUtilityService: CommonUtilityService,
		private readonly monthlyProofHelperService: MonthlyProofHelperService,
		private readonly docDaoService: DocDaoService,
		private readonly configurationService: ConfigurationService,
		private readonly disputeDaoService: DisputeDaoService,
		private readonly userDaoService: UserDaoService,
		private readonly dataSource: DataSource,
		private readonly aliasDaoService: AliasDaoService,
		private readonly mongoDaoService: MongoDaoService,
		private readonly packageDaoService: PackageDaoService,
		private readonly docHelperSerice: DocHelperService
	) {}

	async getDocMonthlyProof(getMontlyProofDto: GetMontlyProofDto, request: any) {
		let { status } = getMontlyProofDto;

		const monthlyProofIds = await this.commonUtilityService.getMonthlyProofIdsForReuploadedStatus(status);
		const response = await this.monthlyDocDaoService.getDocMonthlyProofByMonthlyProofTypeAndStatus(
			getMontlyProofDto,
			monthlyProofIds
		);

		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const configs = await this.configurationService.getBusinessConfigurations(userDetailModel?.businessId);
		const { phonePermission, emailPermission, ssnPermission } = await this.commonUtilityService.getPiiPermissionData(
			userDetailModel?.userId
		);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT);
		response?.monthlyDocData.forEach((monthlyData) => {
			monthlyData["reportingDuration"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				monthlyData["reportingDuration"],
				dateFormat
			);
			monthlyData["ssnId"] = this.commonUtilityService.formatSsn(monthlyData["ssnId"], ssnPermission);
			monthlyData["userMobileNumber"] = this.commonUtilityService.formatMobileNumber(
				monthlyData["userMobileNumber"],
				phonePermission
			);
			monthlyData["userFirstName"] = this.commonUtilityService.capitalizeWords(monthlyData["userFirstName"]);
			monthlyData["userLastName"] = this.commonUtilityService.capitalizeWords(monthlyData["userLastName"]);
			monthlyData["userEmail"] = this.commonUtilityService.formatEmail(monthlyData["userEmail"], emailPermission);
		});
		return response;
	}

	async getCreditorPayPlaidData(creditorPayPlaidDto: GetCreditorPayPlaidDataDto) {
		const { plaidTxnStatus, monthMatchingStatus, paymentMonth, paymentYear } = creditorPayPlaidDto;
		if (
			(monthMatchingStatus === MonthMatchingStatus.CRYRBOT_ASSIGNED ||
				monthMatchingStatus === MonthMatchingStatus.CRYREMP_ASSIGNED ||
				plaidTxnStatus === PlaidTxnStatus.NO_MATCHING_CREDITOR) &&
			(!paymentMonth || !paymentYear)
		) {
			throw new HttpException({ status: ResponseData.MONTH_AND_YEAR_NOT_PROVIDED }, HttpStatus.OK);
		}
		const userIds = [];
		const requiredPlaidTxnData = {};
		if (plaidTxnStatus || monthMatchingStatus || paymentMonth || paymentYear) {
			await this.monthlyProofHelperService.getFileteredMongoTxns(
				plaidTxnStatus,
				monthMatchingStatus,
				paymentMonth,
				paymentYear,
				requiredPlaidTxnData,
				userIds
			);
		}
		const refdocIds = Object.keys(requiredPlaidTxnData).map((id) => {
			return +id;
		});
		const response = await this.monthlyDocDaoService.getCreditorPayPlaidData(creditorPayPlaidDto, userIds, refdocIds);

		const businessId = response.creditorPayPlaidData[0].businessId;
		const configs = await this.configurationService.getBusinessConfigurations(businessId);
		const dateTimeFormat = configs.get(ConfigCodeEnum.DEFAULT_DATETIME_FORMAT);

		response.creditorPayPlaidData.forEach((data) => {
			data["createdAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data["createdAt"],
				dateTimeFormat
			);
			data["plaidtxnData"] = requiredPlaidTxnData[data.refdocId];
			if (monthMatchingStatus === MonthMatchingStatus.UNASSIGNED) {
				data["plaidtxnData"]["paymentMonth"] = null;
			}
		});

		return response;
	}

	async getCreditorPayPlaidDetails(creditorPayPlaidDetailsDto: GetCreditorPayPlaidDetailsDto, request: any) {
		const { refdocId, customerId, month, year, plaidTxnStatus, monthMatchingStatus } = creditorPayPlaidDetailsDto;

		if (
			(monthMatchingStatus === MonthMatchingStatus.CRYRBOT_ASSIGNED ||
				monthMatchingStatus === MonthMatchingStatus.CRYREMP_ASSIGNED ||
				plaidTxnStatus === PlaidTxnStatus.NO_MATCHING_CREDITOR) &&
			!month &&
			!year
		) {
			throw new HttpException({ status: ResponseData.MONTH_AND_YEAR_NOT_PROVIDED }, HttpStatus.OK);
		}
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const userInfo = await this.userDaoService.getUserInfoByUserId(customerId);
		let plaidTxnData = await this.monthlyDocDaoService.getPlaidTxnsData(refdocId, month, year);
		if (plaidTxnStatus === PlaidTxnStatus.NO_CREDITOR) {
			let firstScheduleWithSubscription;
			const paymentSchedules = await this.docDaoService.getPaymentScheduleByRefdocId(refdocId);
			for (const schedule of paymentSchedules) {
				const subscription = await this.packageDaoService.getSubscriptionForMonthAndYearForRefdoc(
					schedule.leaseId,
					schedule.reportingMonth,
					schedule.reportingYear
				);
				if (subscription) {
					firstScheduleWithSubscription = schedule;
					break;
				}
			}
			plaidTxnData = { ...plaidTxnData, ...firstScheduleWithSubscription };
		}

		const approvedProofs = await this.monthlyDocDaoService.getRefdocPaymentWiseTotalRentPaid(
			refdocId,
			plaidTxnData["reportingMonth"],
			plaidTxnData["reportingYear"]
		);

		const configs = await this.configurationService.getChannelConfigurations(userInfo.channelId);

		return await this.monthlyProofHelperService.formatPlaidTxnsDetails(
			configs,
			userInfo,
			plaidTxnData,
			userDetailModel,
			approvedProofs
		);
	}

	async getPlaidTxns(plaidTxnsDto: GetPlaidTxnsDto) {
		let { refdocId, customerId, plaidTxnStatus, month, year, monthMatchingStatus } = plaidTxnsDto;
		const userInfo = await this.userDaoService.getUserInfoByUserId(customerId);
		const configs = await this.configurationService.getChannelConfigurations(userInfo?.channelId);
		const currencyFormattingData = await this.commonUtilityService.getDataforCurrencyFormatting(configs);
		const dateTimeFormat = configs.get(ConfigCodeEnum.DEFAULT_DATETIME_FORMAT);
		const masterProofs = await this.docDaoService.getMasterProofWithPaymentValidationDocByRefdocIdAndUserId(
			refdocId,
			customerId
		);
		let firstFetchFrom;
		const masterProofsObj = {};
		masterProofs.forEach((proof) => {
			if (!firstFetchFrom) {
				firstFetchFrom = new Date(proof.firstFetchFrom);
			}
			masterProofsObj[proof.masterProofId] = proof;
		});
		let newPlaidTxnStatus;
		if (plaidTxnStatus === PlaidTxnStatus.QUALIFIED) {
			newPlaidTxnStatus = [PlaidTxnStatus.CRYREMP_QUALIFIED, PlaidTxnStatus.CRYRBOT_QUALIFIED];
		} else if (plaidTxnStatus === PlaidTxnStatus.REJECTED) {
			newPlaidTxnStatus = [PlaidTxnStatus.CRYRBOT_REJECTED, PlaidTxnStatus.CRYREMP_REJECTED];
		} else {
			newPlaidTxnStatus = [plaidTxnStatus];
		}
		let mongoPlaidTxns = await this.mongoDaoService.getMongoPlaidDataByRefdocIdAndStatus(+refdocId, newPlaidTxnStatus);
		mongoPlaidTxns = mongoPlaidTxns.filter((txn) => {
			const masterProofData = masterProofsObj[txn.masterProofId];
			if (masterProofData) {
				Object.assign(txn, masterProofData);
				return true;
			}
			return false;
		});

		let paymentSchedule: PaymentSchedule;
		if ((month && year) || plaidTxnStatus === PlaidTxnStatus.NO_CREDITOR) {
			mongoPlaidTxns = await this.monthlyProofHelperService.createPaymentScheduleAndFilterTxns(
				plaidTxnStatus,
				refdocId,
				paymentSchedule,
				mongoPlaidTxns,
				month,
				year
			);
		}

		let allowedFromDate: Date, allowedToDate: Date, defaultFromDate: Date, defaultToDate: Date, txnActionBtnHide;

		const qualifiedTxns =
			await this.mongoDaoService.getMongoPlaidDataByRefdocIdStatusMonthMatchingStatusAndScheduleStatus(
				+refdocId,
				[PlaidTxnStatus.CRYRBOT_QUALIFIED, PlaidTxnStatus.CRYREMP_QUALIFIED],
				[MonthMatchingStatus.CRYRBOT_ASSIGNED, MonthMatchingStatus.CRYREMP_ASSIGNED]
			);

		const firstDateOfSelectedMonth = this.commonUtilityService.getFirstDateOfMonthFromMonthYear(month, year);

		let latestApprovedTxn, latestApprovedTxnDate: Date, approvedTxnDateBeforeSelectedMonth: Date;

		if (qualifiedTxns.length) {
			latestApprovedTxn = qualifiedTxns.reduce((latestTxn, currentTxn) => {
				const latestDate = new Date(latestTxn.plaidData["date"]);
				const currentDate = new Date(currentTxn.plaidData["date"]);
				if (currentDate < new Date(firstDateOfSelectedMonth) && approvedTxnDateBeforeSelectedMonth < currentDate) {
					approvedTxnDateBeforeSelectedMonth = currentDate;
				}
				return latestDate > currentDate ? latestTxn : currentTxn;
			});
			latestApprovedTxnDate = new Date(latestApprovedTxn.plaidData["date"]);
			allowedFromDate = latestApprovedTxnDate;
		} else {
			allowedFromDate = firstFetchFrom;
		}
		const requiredDataObj = { refdocId, latestApprovedTxnDate, monthMatchingStatus };
		const createRangeData = await this.monthlyProofHelperService.createDateRanges(
			plaidTxnStatus,
			paymentSchedule,
			requiredDataObj,
			firstFetchFrom,
			qualifiedTxns,
			approvedTxnDateBeforeSelectedMonth,
			mongoPlaidTxns
		);

		txnActionBtnHide = createRangeData.txnActionBtnHide;
		allowedFromDate = createRangeData.allowedFromDate;
		allowedToDate = createRangeData.allowedToDate;
		defaultFromDate = createRangeData.defaultFromDate;
		defaultToDate = createRangeData.defaultToDate;
		mongoPlaidTxns = createRangeData.newMongoPlaidTxns;
		const paymentSchedules = await this.docDaoService.getPaymentScheduleByRefdocId(+refdocId);
		const paymentScheduleWithSubscription = [];
		for (const schedule of paymentSchedules) {
			const subscription = await this.packageDaoService.getSubscriptionForMonthAndYearForRefdoc(
				schedule.leaseId,
				schedule.reportingMonth,
				schedule.reportingYear
			);
			if (subscription) {
				paymentScheduleWithSubscription.push(schedule);
			}
		}

		if (allowedFromDate && allowedToDate) {
			mongoPlaidTxns = mongoPlaidTxns.filter((txn) => {
				const txnDate = new Date(txn.plaidData["date"]);
				if (txnDate.getTime() >= allowedFromDate.getTime() && txnDate.getTime() <= allowedToDate.getTime()) {
					return true;
				} else {
					return false;
				}
			});
		}

		await this.monthlyProofHelperService.formatPlaidTxns(mongoPlaidTxns, currencyFormattingData, dateTimeFormat);

		const response = {
			mongoPlaidTxns,
			allowedFromDate,
			allowedToDate,
			defaultFromDate,
			defaultToDate,
			txnActionBtnHide,
			paymentScheduleWithSubscription
		};

		return response;
	}

	async getDocMonthlyProofFullDetails(getMontlyProofDto: GetMontlyProofFullDetailsDto, request: any) {
		const { monthlyProofId } = getMontlyProofDto;
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const monthlyProofIds = await this.commonUtilityService.getMonthlyProofIdsForReuploadedStatus(
			MonthlyProofStatusEnum.REUPLOADED
		);
		const monthlyProofDetail = await this.monthlyDocDaoService.getMonthlyProofFullDetails(
			monthlyProofId,
			monthlyProofIds
		);
		if (monthlyProofDetail[VariablesConstant.MONTHLY_PROOF_DETAIL]?.filteredTransactions?.length) {
			monthlyProofDetail[VariablesConstant.MONTHLY_PROOF_DETAIL]["filteredTransactions"] = monthlyProofDetail[
				VariablesConstant.MONTHLY_PROOF_DETAIL
			]["filteredTransactions"].filter((data) => {
				if (data.status !== MonthlyProofStatusEnum.APPROVED) {
					delete data["counterparties"];
					return true;
				}
				return false;
			});
		}
		if (monthlyProofDetail[VariablesConstant.MONTHLY_PROOF_DETAIL]?.otherTransactions?.length) {
			monthlyProofDetail[VariablesConstant.MONTHLY_PROOF_DETAIL]["otherTransactions"] = monthlyProofDetail[
				VariablesConstant.MONTHLY_PROOF_DETAIL
			]["otherTransactions"].filter((data) => {
				if (data.status !== MonthlyProofStatusEnum.APPROVED) {
					delete data["counterparties"];
					return true;
				}
				return false;
			});
		}

		if (
			monthlyProofDetail.monthlyProofStatus === MonthlyProofStatusEnum.APPROVED &&
			monthlyProofDetail[VariablesConstant.MONTHLY_PROOF_DETAIL]?.otherTransactions?.length &&
			monthlyProofDetail[VariablesConstant.MONTHLY_PROOF_DETAIL]?.otherTransactions?.length
		) {
			monthlyProofDetail[VariablesConstant.MONTHLY_PROOF_DETAIL]["filteredTransactions"] = [];
			monthlyProofDetail[VariablesConstant.MONTHLY_PROOF_DETAIL]["otherTransactions"] = [];
		}
		const approvedProofs = await this.monthlyDocDaoService.getRefdocPaymentWiseTotalRentPaid(
			monthlyProofDetail?.refdocId,
			monthlyProofDetail?.reportingMonth,
			monthlyProofDetail?.reportingYear
		);
		if (monthlyProofDetail["disputeId"]) {
			const disputeHistory = await this.disputeDaoService.getDisputeHistoryByDisputeId(
				monthlyProofDetail["disputeId"]
			);

			let receiptRequestEnable;
			if (disputeHistory[disputeHistory.length - 1].comment) {
				const commentObj = JSON.parse(disputeHistory[disputeHistory.length - 1].comment);
				if (commentObj["comment"] === "Please provide receipt") {
					receiptRequestEnable = false;
				} else {
					receiptRequestEnable = true;
				}
			}
			monthlyProofDetail["receiptRequestEnable"] = receiptRequestEnable;
		}

		const configs = await this.configurationService.getChannelConfigurations(monthlyProofDetail.channelId);
		return await this.monthlyProofHelperService.formatMonthlyProofDetails(
			configs,
			monthlyProofDetail,
			approvedProofs,
			userDetailModel
		);
	}

	async docMonthlyProofUpdateStatus(approveMonthlyProofDto: ApproveMonthlyProofDto, request: any) {
		const userDetailModel = request[VariablesConstant?.USER_DETAIL_MODEL];
		let verifierId = userDetailModel?.userId;
		const { monthlyProofId, status, rejectedReasonId, transactionIds, amount, remark, transactionDate, veriDocType } =
			approveMonthlyProofDto;
		if (!transactionIds.length) {
			throw new HttpException({ status: ResponseData.INVALID_TRANSACTION_ID }, HttpStatus.OK);
		}
		const monthlyProofData = await this.monthlyDocDaoService.getmonthlyProofDocById(monthlyProofId);
		const userInfo = await this.userDaoService.getUserInfoByUserId(monthlyProofData.userId);
		const { aliasName } = await this.aliasDaoService.getAliasDataByUserId(userInfo.userId);
		const { docType } = await this.monthlyDocDaoService.getMonthlyProofNameByMasterProofId(
			monthlyProofData.masterProofId
		);
		const masterProofData = await this.docDaoService.getMasterProofByMasterProofId(monthlyProofData.masterProofId);
		const { refdocType } = await this.docDaoService.getRefdocTypeByMasterProofId(monthlyProofData.masterProofId);
		let eventType;
		if (
			monthlyProofData.status !== MonthlyProofStatusEnum.REQUESTED &&
			monthlyProofData.status !== MonthlyProofStatusEnum.QUALIFIED &&
			monthlyProofData.status !== MonthlyProofStatusEnum.PARTIALLY_APPROVED &&
			monthlyProofData.status !== MonthlyProofStatusEnum.APPROVED
		) {
			throw new HttpException({ status: ResponseData.INVALID_MONTHLY_PROOF_ID }, HttpStatus.OK);
		}
		await this.monthlyProofHelperService.validateTxnId(transactionIds, masterProofData);
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			if (status === MonthlyProofStatusEnum.QUALIFIED) {
				const monthlyAndMasterProofData = {
					masterProofData: masterProofData,
					monthlyProofData: monthlyProofData,
					amount: amount
				};
				await this.monthlyProofHelperService.handleApprovedMonthlyProofs(
					monthlyAndMasterProofData,
					transactionIds,
					transactionDate,
					approveMonthlyProofDto
				);
				eventType = KafkaEventTypeEnum.VERFICATION_SUCCESSFUL;
			} else {
				await this.monthlyProofHelperService.checkRejectedReasonId(rejectedReasonId);
				monthlyProofData.updateRejectedReasonId(rejectedReasonId);
				let proofDetail;
				if (JSON.parse(monthlyProofData.proofDetail)) {
					proofDetail = JSON.parse(monthlyProofData.proofDetail);
				} else {
					proofDetail = {};
				}
				const rejectionReason = await this.docDaoService.getRejectionReasonData(rejectedReasonId, Status.ACTIVE);
				proofDetail["rejectionReason"] = rejectionReason.reason;
				const paymentTypeData = await this.docDaoService.getPaymentTypeNameByPaymentType(veriDocType);
				proofDetail["paymentType"] = paymentTypeData.docTypeName;
				eventType = KafkaEventTypeEnum.VERFICATION_FAILED;
				monthlyProofData.proofDetail = JSON.stringify(proofDetail);
			}
			if (remark) {
				monthlyProofData.remark = remark;
			}
			if (monthlyProofData.receipt) {
				const newReceiptObjArr = this.monthlyProofHelperService.verifyReceipt(
					monthlyProofData.receipt,
					status,
					rejectedReasonId
				);
				monthlyProofData.receipt = JSON.stringify(newReceiptObjArr);
			}
			monthlyProofData.status = status;
			monthlyProofData.updateVerifingUserData(verifierId);
			await this.monthlyDocDaoService.saveMonthlyProofDocFromQueryRunner(queryRunner, monthlyProofData);
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
		await this.docHelperSerice.sendUserEvent(
			userInfo,
			docType,
			eventType,
			aliasName,
			refdocType,
			ScreenNames.MONTHLY_PROOF_SCREEN_NAME,
			masterProofData.refdocId
		);
	}

	async qualifyPlaidTxns(qualifyPlaidTxnsDto: QualifyPlaidTxnsDto) {
		const queryRunner = this.dataSource.createQueryRunner();
		let mongoPlaidTxns;
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			const { refdocId, transactionIds } = qualifyPlaidTxnsDto;

			let creditor;
			const plaidTxn = await this.mongoDaoService.getMongoPlaidDataByTxnIds("transaction_id", transactionIds);
			if (!plaidTxn) {
				throw new HttpException({ status: ResponseData.INVALID_TRANSACTION_ID }, HttpStatus.OK);
			}
			let txnDate;
			plaidTxn.map((txn) => {
				if (txn.plaidData["merchant_name"]) {
					creditor = txn.plaidData["merchant_name"];
					txnDate = new Date(txn.plaidData["date"]);
				} else {
					throw new HttpException({ status: ResponseData.NO_MERCHANT_NAME }, HttpStatus.OK);
				}
			});
			await this.monthlyProofHelperService.updateCreditor(refdocId, creditor, queryRunner);
			await this.monthlyProofHelperService.removeNonCreditor(creditor, refdocId, queryRunner);
			mongoPlaidTxns = await this.mongoDaoService.getMongoPlaidDataByRefdocIdAndStatus(+refdocId, [
				PlaidTxnStatus.NO_CREDITOR,
				PlaidTxnStatus.NO_MATCHING_CREDITOR,
				PlaidTxnStatus.CRYRBOT_REJECTED,
				PlaidTxnStatus.CRYREMP_REJECTED
			]);
			for (const txn of mongoPlaidTxns) {
				if (creditor === txn.plaidData?.["merchant_name"]) {
					txn.plaidData["status"] = PlaidTxnStatus.CRYREMP_QUALIFIED;
					txn.status = PlaidTxnStatus.CRYREMP_QUALIFIED;
				} else {
					if (
						((txn.status === PlaidTxnStatus.NO_CREDITOR || txn.status === PlaidTxnStatus.NO_MATCHING_CREDITOR) &&
							new Date(txn.plaidData["date"]) > txnDate) ||
						txn.status === PlaidTxnStatus.CRYRBOT_REJECTED ||
						txn.status === PlaidTxnStatus.CRYREMP_REJECTED
					) {
						continue;
					}
					await this.monthlyProofHelperService.updateNonCreditor(refdocId, txn.plaidData?.["merchant_name"]);
					txn.plaidData["status"] = PlaidTxnStatus.CRYREMP_REJECTED;
					txn.status = PlaidTxnStatus.CRYREMP_REJECTED;
				}
			}
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
		this.mongoDaoService.saveMongoPlaidData(mongoPlaidTxns);
	}

	async rejectPlaidTransaction(rejectPlaidDto: RejectPlaidDto) {
		const { transactionIds, refdocId } = rejectPlaidDto;
		let mongoPlaidTxns;
		const txnsForRejectionObj = {};

		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();

			if (transactionIds.length) {
				let nonCreditor = await this.monthlyProofHelperService.getCreditorByTxnIds(transactionIds);

				mongoPlaidTxns = await this.mongoDaoService.getMongoPlaidDataByRefdocIdAndStatus(+refdocId, [
					PlaidTxnStatus.CRYRBOT_QUALIFIED,
					PlaidTxnStatus.CRYREMP_QUALIFIED,
					PlaidTxnStatus.NO_CREDITOR,
					PlaidTxnStatus.NO_MATCHING_CREDITOR
				]);

				await this.monthlyProofHelperService.updateMongoTxnsForRejection(
					mongoPlaidTxns,
					nonCreditor,
					txnsForRejectionObj,
					refdocId
				);

				if (!Object.values(txnsForRejectionObj).length) {
					await this.monthlyProofHelperService.removeCreditor(refdocId, nonCreditor, queryRunner);
					await this.monthlyProofHelperService.updateNonCreditor(refdocId, nonCreditor);
					await this.mongoDaoService.saveMongoPlaidData(mongoPlaidTxns);
				} else {
					return { txnsForRejection: Object.values(txnsForRejectionObj), txnId: transactionIds };
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

	async rejectSelectedPlaidTxn(rejectSelectedPlaidDto: RejectSelectedPlaidTxnDto) {
		const { refdocId, txnsInfo, txnId } = rejectSelectedPlaidDto;

		let nonCreditor = await this.monthlyProofHelperService.getCreditorByTxnIds(txnId);

		let mongoPlaidTxns = await this.mongoDaoService.getMongoPlaidDataByRefdocIdAndStatus(+refdocId, [
			PlaidTxnStatus.CRYRBOT_QUALIFIED,
			PlaidTxnStatus.CRYREMP_QUALIFIED,
			PlaidTxnStatus.NO_CREDITOR,
			PlaidTxnStatus.NO_MATCHING_CREDITOR
		]);

		mongoPlaidTxns = this.monthlyProofHelperService.filterMongoPlaidTxnsForSelectedPlaidTxns(
			mongoPlaidTxns,
			nonCreditor
		);

		await this.mongoDaoService.saveMongoPlaidData(mongoPlaidTxns);

		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			await this.monthlyProofHelperService.removeCreditor(refdocId, nonCreditor, queryRunner);
			await this.monthlyProofHelperService.updateNonCreditor(refdocId, nonCreditor);

			for (const txnInfo of txnsInfo) {
				const masterProofIds = [];
				const txnsForMasterProofIds = {};

				this.monthlyProofHelperService.createMasterProofIdsAndTxnsForMasterProofIds(
					txnInfo,
					masterProofIds,
					txnsForMasterProofIds
				);

				for (const masterProofId of masterProofIds) {
					const monthlyProof = await this.monthlyDocDaoService.getmonthlyProofDocByMasterProofMonthAndYear(
						masterProofId,
						txnInfo["scheduleInfo"]["month"],
						+txnInfo["scheduleInfo"]["year"]
					);

					const concernedVerifiedProofs = await this.monthlyDocDaoService.getMonthlyVerifiedProofsByTxnIds(
						txnsForMasterProofIds[masterProofId]
					);

					for (const proof of concernedVerifiedProofs) {
						proof.status = VerifiedProofStatusEnum.REJECTED_AFTER_APPROVAL;

						const newPaymentScheduleStatus =
							await this.monthlyProofHelperService.revertUpdatesForApprovedTransaction(proof, queryRunner);

						await this.monthlyProofHelperService.rejectPlaidTxnsByPaymentScheduleStatus(
							monthlyProof,
							newPaymentScheduleStatus,
							refdocId,
							txnInfo,
							proof,
							masterProofId,
							queryRunner
						);
					}
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

	async assignMonth(assignMonthDto: AssignMonthDto) {
		const { transactionId, month, year } = assignMonthDto;
		const plaidTxn = await this.mongoDaoService.getMongoPlaidDataByTxnId("transaction_id", transactionId);
		if (!plaidTxn) {
			throw new HttpException({ status: ResponseData.INVALID_TRANSACTION_ID }, HttpStatus.OK);
		}
		plaidTxn.monthMatching = MonthMatchingStatus.CRYREMP_ASSIGNED;
		plaidTxn.month = month;
		plaidTxn.year = +year;
		plaidTxn.status = PlaidTxnStatus.CRYREMP_QUALIFIED;
		plaidTxn.plaidData["status"] = PlaidTxnStatus.CRYREMP_QUALIFIED;

		await this.mongoDaoService.saveSingleMongoPlaidData(plaidTxn);
	}

	async saveMonthlyProof(
		files: Record<string, Express.Multer.File[]>,
		saveMonthlyProofDto: SaveMonthlyProofDto,
		request: any
	) {
		const { userid, businessId, aliasName } = request.headers;
		const userInfo = request[VariablesConstant.USER_DETAIL_MODEL];
		const { masterProofId, discription, month, year } = saveMonthlyProofDto;
		const { refdocType } = await this.docDaoService.getRefdocTypeByMasterProofId(masterProofId);
		const monthName = MonthMapEnum[month.toString()];
		if (
			!masterProofId ||
			!monthName ||
			!files?.files?.length ||
			!files?.additionalFiles?.length ||
			!this.monthlyProofHelperService.validateFiles(files?.files) ||
			!this.monthlyProofHelperService.validateFiles(files?.additionalFiles)
		) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		const masterProof = await this.docDaoService.getMasterProofsByPayeeIdMasterProofIdAndStatus(
			masterProofId,
			userid,
			ProofStatus.APPROVED
		);
		const { docTypeName } = await this.docDaoService.getPaymentTypeNameByPaymentType(masterProof.paymentType);
		const activeDispute = await this.disputeDaoService.getActiveDisputesByMasterProofIdAndRaisedBy(
			masterProofId,
			userid
		);
		if (activeDispute) {
			throw new HttpException({ status: ResponseData.DISPUTE_ALREADY_RAISED }, HttpStatus.OK);
		}
		let proofUrls;
		const monthlyProof = new ValidationDocMonthlyProof(
			masterProof.userId,
			masterProof.id,
			MonthlyProofTypeEnum.RECEIPT,
			0,
			null,
			MonthlyProofStatusEnum.REQUESTED
		);
		monthlyProof.updateRefdocDueDates(monthName, year);
		proofUrls = await this.monthlyProofHelperService.uploadMultipleFilesToS3(files?.files, businessId);
		const receiptUrls = await this.monthlyProofHelperService.uploadMultipleFilesToS3(files?.additionalFiles, businessId);
		monthlyProof.updateProofUrl(JSON.stringify(proofUrls));
		const receiptObjArr = this.commonUtilityService.createReceiptObj(receiptUrls);
		monthlyProof.receipt = JSON.stringify(receiptObjArr);
		if (discription) {
			monthlyProof.updateProofDetails(JSON.stringify({ discription }));
		}
		await this.monthlyDocDaoService.saveMonthlyProofDoc(monthlyProof);
		this.docHelperSerice.sendUserEvent(
			userInfo,
			docTypeName,
			KafkaEventTypeEnum.UPLOAD_SUCCESSFUL,
			aliasName,
			refdocType,
			ScreenNames.MONTHLY_PROOF_SCREEN_NAME,
			masterProof.refdocId
		);
	}

	async getUserMonthlyProofsForRefdoc(monthlyProofsDto: MonthlyProofsDto, request: any) {
		const { userid } = request.headers;
		const { refdocId, type, month, year } = monthlyProofsDto;
		if (!refdocId || !Object.values(TypeEnum).includes(type) || !MonthMapEnum[month] || !year) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		if (type === TypeEnum.DISPUTE) {
			return await this.monthlyProofHelperService.getMasterProofDataForDispute(monthlyProofsDto, userid);
		}
		return await this.monthlyProofHelperService.getMasterProofDataForMonthlyProof(monthlyProofsDto, userid);
	}

	async getApprovedProofs(monthlyProofsDto: MonthlyProofsDto, request: any) {
		const { refdocId, month, year } = monthlyProofsDto;
		const userInfo = request[VariablesConstant?.USER_DETAIL_MODEL];
		const monthName = MonthMapEnum[month];
		if (!monthName) {
			throw new HttpException({ status: ResponseData.INVALID_MONTH }, HttpStatus.OK);
		}
		const verifiedProofs = await this.monthlyDocDaoService.getVerifiedProofs(refdocId, monthName, year.toString());
		const paymentSchedule = await this.docDaoService.getPaymentScheduleByMonthYearAndRefdoc(refdocId, monthName, year);
		const configs = await this.configurationService.getChannelConfigurations(userInfo.channelId);
		return this.monthlyProofHelperService.formatVerifiedProofs(configs, verifiedProofs, paymentSchedule);
	}

	async getCreditorsAndCategoryDropdown(creditorDropdownDto: CreditorDropdownDto) {
		const { refdocId, plaidTxnStatus } = creditorDropdownDto;
		let newPlaidTxnStatus;
		if (plaidTxnStatus === PlaidTxnStatus.QUALIFIED) {
			newPlaidTxnStatus = [PlaidTxnStatus.CRYREMP_QUALIFIED, PlaidTxnStatus.CRYRBOT_QUALIFIED];
		} else if (plaidTxnStatus === PlaidTxnStatus.REJECTED) {
			newPlaidTxnStatus = [PlaidTxnStatus.CRYRBOT_REJECTED, PlaidTxnStatus.CRYREMP_REJECTED];
		} else {
			newPlaidTxnStatus = [plaidTxnStatus];
		}
		let plaidTxns = await this.mongoDaoService.getMongoPlaidDataByRefdocIdAndStatus(+refdocId, newPlaidTxnStatus);
		const creditorArr = [];
		const categoryArr = [];
		plaidTxns.forEach((txn) => {
			if (txn.plaidData["merchant_name"]) {
				creditorArr.push(txn.plaidData["merchant_name"]);
			}
			if (txn.plaidData["personal_finance_category"]["detailed"]) {
				categoryArr.push(txn.plaidData["personal_finance_category"]["detailed"]);
			}
		});
		return { creditorArr, categoryArr };
	}
}
