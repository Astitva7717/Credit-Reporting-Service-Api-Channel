import { MemoryStorageFile } from "@blazity/nest-file-fastify";
import {
	InboxDeepLinkParams,
	KafkaEventMessageDto,
	KafkaEventTypeEnum,
	LeaseEventParams,
	MonthlyProofDueEventParams
} from "@kafka/dto/kafka-event-message.dto";
import { NotificationProducerService } from "@kafka/producer/notification-producer/notification-producer-service";
import { DocDaoService } from "@modules/dao/doc-dao/doc-dao.service";
import { MonthlyDocDaoService } from "@modules/dao/monthly-doc-dao/monthly-doc-dao.service";
import { UserDaoService } from "@modules/dao/user-dao/user-dao.service";
import { PaymentSchedule, PaymentScheduleStatus } from "@modules/doc/entities/payment-schedule.entity";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CommonUtilityService } from "@utils/common/common-utility/common-utility.service";
import { DetailedConstants } from "@utils/constants/plaid-constants";
import {
	MonthlyProofStatusEnum,
	PaymentTypeCodeEnum,
	ReceiptStatusEnum,
	Status,
	VerifiedProofStatusEnum,
	YNStatusEnum
} from "@utils/enums/Status";
import { ResponseData } from "@utils/enums/response";
import { Transaction } from "plaid";
import { MonthlyProofsDto } from "../dto/monthly-proofs.dto";
import { MonthMapEnum, MonthNameToNumberEnum } from "@utils/constants/map-month-constants";
import { QueryRunner } from "typeorm";
import {
	MasterProofTypeEnum,
	ProofStatus,
	ValidationDocMasterProof
} from "@modules/doc/entities/validation-doc-master-proof.entity";
import { UserMasterEntity } from "@modules/user-master/entities/user-master.entity";
import { ConfigCodeEnum } from "@utils/enums/constants";
import { DocHelperService } from "@modules/doc/doc-helper/doc-helper.service";
import { ScreenNames } from "@utils/enums/communication-enums";
import { AliasDaoService } from "@modules/dao/alias-dao/alias-dao.service";
import { MonthlyVerifiedProofsEntity } from "../entities/monthly-proof-verified.entity";
import { ValidationDocMonthlyProof } from "../entities/validation-doc-monthly-proof.entity";
import { UserPaymentScheduleStatus } from "@modules/doc/entities/user-payment-schedule.entity";
import { ReportingStatus } from "@modules/reporting/entities/user-credit-reporting-request.entity";
import { ReportingDaoService } from "@modules/dao/reporting-dao/reporting-dao.service";
import { ApproveMonthlyProofDto } from "../dto/approve-monthly-proof.dto";
import {
	MongoPlaidData,
	MonthMatchingStatus,
	PlaidTxnStatus,
	ScheduleStatusEnum
} from "@modules/mongo/entities/mongoPlaidDataEntity";
import { MongoDaoService } from "@modules/dao/mongo-dao/mongo-dao.service";
import { RefdocMaster } from "@modules/doc/entities/refdoc-master.entity";
import { LeaseSpecificNonCreditorList } from "../entities/lease-specific-non-creditor-list.entity";
import { PackageDaoService } from "@modules/dao/package-dao/package-dao.service";
import { CreditorActionEnum, CreditorUpdatesAsync, StatusEnum } from "../entities/creditor-updates-async.entity";
import { ParticipantDaoService } from "@modules/dao/participant-dao/participant-dao.service";
import { MonthlyProofTypeEnum } from "@utils/enums/txn-types";
import VariablesConstant from "@utils/variables-constant";

@Injectable()
export class MonthlyProofHelperService {
	constructor(
		private docDaoService: DocDaoService,
		private commonUtilityService: CommonUtilityService,
		private monthlyDocDaoService: MonthlyDocDaoService,
		private userDaoService: UserDaoService,
		private aliasDaoService: AliasDaoService,
		private notificationProducerService: NotificationProducerService,
		private readonly docHelperService: DocHelperService,
		private readonly participantDaoService: ParticipantDaoService,
		private readonly packageDaoService: PackageDaoService,
		private reportingDaoService: ReportingDaoService,
		private mongoDaoService: MongoDaoService
	) {}

	async checkRejectedReasonId(rejectedReasonId: number) {
		if (!rejectedReasonId) {
			throw new HttpException({ status: ResponseData.INVALID_REJECTION_REASON_ID }, HttpStatus.OK);
		}
		await this.docDaoService.getRejectionReasonData(rejectedReasonId, Status.ACTIVE);
	}

	validateFiles(files: MemoryStorageFile[]) {
		return !files.filter((file) => {
			if (!file?.buffer?.buffer?.byteLength) {
				return true;
			}
		}).length;
	}

	async uploadMultipleFilesToS3(files, businessId: number) {
		const fileUrls = [];
		for (let file of files) {
			let data = await this.commonUtilityService.uploadImageToS3(file, businessId);
			fileUrls.push(data?.url);
		}
		return fileUrls;
	}

	async updatePaymentScheduleStatusByQueryRunner(
		monthlyProof: ValidationDocMonthlyProof,
		refdocId: number,
		amount: number,
		queryRunner: QueryRunner,
		txnIdToDataMapping: any
	) {
		const paymentSchedule = await this.docDaoService.getPaymentScheduleByMonthYearAndRefdoc(
			refdocId,
			monthlyProof.reportingMonth,
			monthlyProof.reportingYear
		);
		if (!paymentSchedule) {
			throw new HttpException({ status: ResponseData.PAYMENT_SCHEDULE_NOT_FOUND }, HttpStatus.OK);
		}
		let reportingRequestStatus = this.getReportingRequestNewStatus(paymentSchedule, txnIdToDataMapping);
		const newPaymentScheduleStatus = paymentSchedule.status;
		await this.docDaoService.savePaymentSchedule([paymentSchedule], queryRunner);
		const userPaymentSchedules = await this.docDaoService.getUserPaymentSchedulesByRefScheduleId(
			paymentSchedule.id,
			queryRunner
		);
		const userPaymentSchedulesIds = [];
		let userScheduleId;
		userPaymentSchedules.map((userPaymentSchedule) => {
			userPaymentSchedulesIds.push(userPaymentSchedule.id);
			if (userPaymentSchedule.userId === monthlyProof.userId) {
				userScheduleId = userPaymentSchedule.id;
				let { approvedAmount, latePayment } = userPaymentSchedule;
				Object.keys(txnIdToDataMapping).forEach((txnId) => {
					const transactionDate = new Date(txnIdToDataMapping[txnId]?.date);
					const amount = txnIdToDataMapping[txnId]?.amount;
					if (new Date(paymentSchedule.paymentDueDate).getTime() > transactionDate.getTime()) {
						approvedAmount = approvedAmount + +amount;
						userPaymentSchedule.updateApprovedAmount(approvedAmount);
					} else {
						latePayment = latePayment + +amount;
						userPaymentSchedule.updateLatePaymentAmount(latePayment);
					}
				});
			}
			userPaymentSchedule.updateStatus(UserPaymentScheduleStatus[newPaymentScheduleStatus]);
		});
		await this.docDaoService.saveUserPaymentScheduleByQueryRunner(userPaymentSchedules, queryRunner);
		const reportingRequests = await this.reportingDaoService.getReportingRequestsByScheduleIds(
			userPaymentSchedulesIds,
			queryRunner
		);
		reportingRequests.forEach((reportingRequest) => {
			if (userScheduleId === +reportingRequest.scheduleId) {
				let approvedAmount = reportingRequest.approvedAmount || 0;
				approvedAmount = +approvedAmount + +amount;
				reportingRequest.updateApprovedAmount(approvedAmount);
			}
			reportingRequest.updateStatus(reportingRequestStatus);
		});
		await this.reportingDaoService.saveMultipleReportingRequest(reportingRequests, queryRunner);
		return newPaymentScheduleStatus;
	}

	async revertUpdatesForApprovedTransaction(verifiedProof: MonthlyVerifiedProofsEntity, queryRunner: QueryRunner) {
		const paymentSchedule = await this.docDaoService.getPaymentScheduleByScheduleId(verifiedProof.scheduleId);
		let reportingRequestStatus = ReportingStatus.AMOUNT_DUE;
		let newPaymentScheduleStatus = PaymentScheduleStatus.PARTIALLY_UPLOADED;
		let rentAmount = paymentSchedule.amount;
		if (paymentSchedule.modifiedAmount) {
			rentAmount = paymentSchedule.modifiedAmount;
		}
		const dateFormat = "YYYY-MM-DD";
		const transactionDate = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			verifiedProof.transactionDate,
			dateFormat
		) as any;
		if (paymentSchedule.paymentDueDate > transactionDate) {
			paymentSchedule.approvedAmount = +paymentSchedule.approvedAmount - +verifiedProof.approvedAmount;
			paymentSchedule.updateApprovedAmount(paymentSchedule.approvedAmount);
		} else {
			paymentSchedule.latePayment = +paymentSchedule.latePayment - +verifiedProof.approvedAmount;
			paymentSchedule.updateLatePaymentAmount(paymentSchedule.latePayment);
		}
		if (paymentSchedule.approvedAmount >= rentAmount) {
			newPaymentScheduleStatus = PaymentScheduleStatus.READY_FOR_REPORTING;
			reportingRequestStatus = ReportingStatus.READY_FOR_REPORTING;
		} else if (paymentSchedule.approvedAmount + paymentSchedule.latePayment >= rentAmount) {
			newPaymentScheduleStatus = PaymentScheduleStatus.LATE_PAYMENT;
			reportingRequestStatus = ReportingStatus.LATE_PAYMENT;
		} else if (paymentSchedule.approvedAmount + paymentSchedule.latePayment === 0) {
			newPaymentScheduleStatus = PaymentScheduleStatus.DUE;
		}
		paymentSchedule.updateStatus(newPaymentScheduleStatus);
		await this.docDaoService.savePaymentSchedule([paymentSchedule], queryRunner);
		const userPaymentSchedules = await this.docDaoService.getUserPaymentSchedulesByRefScheduleId(
			paymentSchedule.id,
			queryRunner
		);
		const userPaymentSchedulesIds = [];
		let userScheduleId;
		userPaymentSchedules.map((userPaymentSchedule) => {
			userPaymentSchedulesIds.push(userPaymentSchedule.id);
			if (userPaymentSchedule.userId === verifiedProof.userId) {
				userScheduleId = userPaymentSchedule.id;
				let { approvedAmount, latePayment } = userPaymentSchedule;

				if (paymentSchedule.paymentDueDate > transactionDate) {
					approvedAmount = approvedAmount - +verifiedProof.approvedAmount;
					userPaymentSchedule.updateApprovedAmount(approvedAmount);
				} else {
					latePayment = latePayment - +verifiedProof.approvedAmount;
					userPaymentSchedule.updateLatePaymentAmount(latePayment);
				}
			}
			userPaymentSchedule.updateStatus(UserPaymentScheduleStatus[newPaymentScheduleStatus]);
		});
		await this.docDaoService.saveUserPaymentScheduleByQueryRunner(userPaymentSchedules, queryRunner);
		const reportingRequests = await this.reportingDaoService.getReportingRequestsByScheduleIds(
			userPaymentSchedulesIds,
			queryRunner
		);
		reportingRequests.forEach((reportingRequest) => {
			if (reportingRequest.status === ReportingStatus.REPORTED) {
				throw new HttpException({ status: ResponseData.MONTHLY_PROOF_IS_REPORTED }, HttpStatus.OK);
			}
			if (userScheduleId === +reportingRequest.scheduleId) {
				let approvedAmount = reportingRequest.approvedAmount || 0;
				approvedAmount = +approvedAmount - +verifiedProof.approvedAmount;
				reportingRequest.updateApprovedAmount(approvedAmount);
			}
			reportingRequest.updateStatus(reportingRequestStatus);
		});
		await this.reportingDaoService.saveMultipleReportingRequest(reportingRequests, queryRunner);
		return newPaymentScheduleStatus;
	}

	getReportingRequestNewStatus(paymentSchedule: PaymentSchedule, txnIdToDataMapping: any) {
		let reportingRequestStatus = ReportingStatus.AMOUNT_DUE;
		let newPaymentScheduleStatus = PaymentScheduleStatus.PARTIALLY_UPLOADED;
		let rentAmount = paymentSchedule.amount;
		if (paymentSchedule.modifiedAmount) {
			rentAmount = paymentSchedule.modifiedAmount;
		}
		let { approvedAmount, latePayment } = paymentSchedule;
		Object.keys(txnIdToDataMapping).forEach((txnId) => {
			const transactionDate = new Date(txnIdToDataMapping[txnId]?.date);
			const amount = txnIdToDataMapping[txnId]?.amount;
			if (new Date(paymentSchedule.paymentDueDate).getTime() > transactionDate.getTime()) {
				approvedAmount = +approvedAmount + +amount;
				paymentSchedule.updateApprovedAmount(approvedAmount);
			} else {
				latePayment = +latePayment + +amount;
				paymentSchedule.updateLatePaymentAmount(latePayment);
			}
			if (approvedAmount >= rentAmount) {
				reportingRequestStatus = ReportingStatus.READY_FOR_REPORTING;
				newPaymentScheduleStatus = PaymentScheduleStatus.READY_FOR_REPORTING;
			} else if (approvedAmount + latePayment >= rentAmount) {
				reportingRequestStatus = ReportingStatus.LATE_PAYMENT;
				newPaymentScheduleStatus = PaymentScheduleStatus.LATE_PAYMENT;
			}
		});
		paymentSchedule.updateStatus(newPaymentScheduleStatus);
		return reportingRequestStatus;
	}

	async getPaymentScheduleNewStatus(monthlyProofId: number) {
		const { totalPaidAmount, refdocId, reportingYear, reportingMonth } =
			await this.monthlyDocDaoService.getMonthlyProofTotalAmount(monthlyProofId);
		const { firstDate, lastDate } = this.commonUtilityService.getFirstAndLastDate(reportingMonth, reportingYear);
		const { amount, id } = await this.monthlyDocDaoService.getPaymentScheduleAmount(refdocId, firstDate, lastDate);
		let paymentScheduleStatus = PaymentScheduleStatus.PARTIALLY_UPLOADED;
		if (totalPaidAmount >= amount) {
			paymentScheduleStatus = PaymentScheduleStatus.UPLOADED;
		}
		return { payemntScheduleId: id, paymentScheduleStatus };
	}

	async sendMonthlyProofUploadEvents(eventProofs: any[], masterRefdocIds: number[], userIdsForEvent: number[]) {
		const refdocTypesData = await this.docDaoService.getRefdocTypes(masterRefdocIds);
		const refdocIdDocTypeMapping = refdocTypesData.reduce((mapping, refdoc) => {
			mapping[refdoc.refdocId] = refdoc.refdocType;
			return mapping;
		}, {});
		const userInfos = await this.userDaoService.getMultiUserDetails(userIdsForEvent);
		const aliasNameObj = {};
		const userIdToUserInfoMapping = {};
		for (let userInfo of userInfos) {
			userIdToUserInfoMapping[userInfo.userId] = userInfo;
			if (!aliasNameObj[userInfo.aliasId]) {
				const { aliasName } = await this.aliasDaoService.getAliasDataByUserId(userInfo.userId);
				aliasNameObj[userInfo.aliasId.toString()] = aliasName;
			}
		}
		const kafkaRequests: KafkaEventMessageDto[] = [];
		eventProofs.forEach((event) => {
			const userInfo = userIdToUserInfoMapping[event.payeeUserId];
			const kafkaEventMessageDto = new KafkaEventMessageDto(
				aliasNameObj[userInfo.aliasId],
				userInfo.currencyCode,
				userInfo.mobileVerified == YNStatusEnum.YES ? userInfo.mobileCode + userInfo.mobileNo : null,
				userInfo.emailVerified == YNStatusEnum.YES ? userInfo.emailId : null,
				userInfo.userType
			);
			kafkaEventMessageDto.addDetails(+userInfo.systemUserId, userInfo.businessId);
			const params: MonthlyProofDueEventParams = {
				firstName: userInfo.firstName,
				lastName: userInfo.lastName,
				docType: refdocIdDocTypeMapping[event.refdocId],
				proofType: event.proofType
			};
			const inboxDeepLinkParams: InboxDeepLinkParams = {
				screenName: ScreenNames.MONTHLY_PROOF_SCREEN_NAME,
				screenReferenceId: event.refdocId
			};
			kafkaEventMessageDto.addParmas(params);
			kafkaEventMessageDto.addInboxDeepLinkParams(inboxDeepLinkParams);
			kafkaRequests.push(kafkaEventMessageDto);
		});
		this.sendMonthlyProofUploadEvent(kafkaRequests, KafkaEventTypeEnum.UPLOAD_DUE);
	}

	async sendMonthlyProofUploadEvent(kafkaRequests: KafkaEventMessageDto[], eventType: KafkaEventTypeEnum) {
		kafkaRequests.forEach((request) => {
			this.notificationProducerService.InviteParticipant(request, eventType);
		});
	}

	async getMasterProofDataForDispute(monthlyProofsDto: MonthlyProofsDto, userId: number) {
		const { refdocId, month, year } = monthlyProofsDto;
		const monthName = MonthMapEnum[month];
		const masterProofData = await this.monthlyDocDaoService.getMasterProofDataByRefdocIdMonthYearWithMonthlyData(
			refdocId,
			monthName,
			year,
			userId
		);
		masterProofData.forEach((masterProof) => {
			masterProof["isMonthProof"] = false;
			masterProof["message"] = "";
			if (masterProof.monthlyProofId) {
				masterProof["isMonthProof"] = true;
				masterProof["message"] = "Monthly Proof approval Pending.";
			}
			masterProof.proofDetail = JSON.parse(masterProof.proofDetail);
			if (masterProof.masterProofType == MasterProofTypeEnum.PLAID) {
				masterProof["proofDetail"] = { accountNo: "****-****-" + masterProof?.proofDetail?.account.slice(-4) };
			}
		});
		return masterProofData;
	}

	async getMasterProofDataForMonthlyProof(monthlyProofsDto: MonthlyProofsDto, userId: number) {
		const { refdocId, month, year } = monthlyProofsDto;
		const monthName = MonthMapEnum[month];
		const masterProofData = await this.monthlyDocDaoService.getMasterProofDataByRefdocIdMonthYearWithDisputeData(
			refdocId,
			monthName,
			year,
			userId
		);
		masterProofData.forEach((masterProof) => {
			masterProof["isDispute"] = false;
			masterProof["message"] = "";
			if (masterProof.disputeId) {
				masterProof["isDispute"] = true;
				masterProof["message"] = "Dispute Pending.";
			}
			masterProof.proofDetail = JSON.parse(masterProof.proofDetail);
			if (masterProof.masterProofType == MasterProofTypeEnum.PLAID) {
				masterProof["proofDetail"] = { accountNo: "****-****-" + masterProof?.proofDetail?.account.slice(-4) };
			}
		});
		return masterProofData;
	}

	async formatMonthlyProofDetails(
		configs: Map<string, string>,
		monthyProof: any,
		approvedProofs: any[],
		userDetailModel: any
	) {
		const dateTimeFormat = configs.get(ConfigCodeEnum.DEFAULT_DATETIME_FORMAT);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT);
		const currencyFormattingData = await this.commonUtilityService.getDataforCurrencyFormatting(configs);
		const { phonePermission, emailPermission } = await this.commonUtilityService.getPiiPermissionData(
			userDetailModel?.userId
		);

		const rentDetails = this.updateMasterProofDetails(approvedProofs, dateTimeFormat, currencyFormattingData);

		monthyProof["primaryUserFirstName"] = this.commonUtilityService.capitalizeWords(monthyProof["primaryUserFirstName"]);
		monthyProof["primaryUserLastName"] = this.commonUtilityService.capitalizeWords(monthyProof["primaryUserLastName"]);
		monthyProof["primaryUserMiddleName"] = this.commonUtilityService.capitalizeWords(
			monthyProof["primaryUserMiddleName"]
		);
		monthyProof["primaryUserSuffixName"] = this.commonUtilityService.capitalizeWords(
			monthyProof["primaryUserSuffixName"]
		);
		monthyProof[VariablesConstant.VERIFY_USER_FIRST_NAME] = this.commonUtilityService.capitalizeWords(
			monthyProof[VariablesConstant.VERIFY_USER_FIRST_NAME]
		);
		monthyProof[VariablesConstant.VERIFY_USER_LAST_NAME] = this.commonUtilityService.capitalizeWords(
			monthyProof[VariablesConstant.VERIFY_USER_LAST_NAME]
		);
		monthyProof[VariablesConstant.VERIFY_USER_MIDDLE_NAME] = this.commonUtilityService.capitalizeWords(
			monthyProof[VariablesConstant.VERIFY_USER_MIDDLE_NAME]
		);
		monthyProof[VariablesConstant.VERIFY_USER_SUFFIX_NAME] = this.commonUtilityService.capitalizeWords(
			monthyProof[VariablesConstant.VERIFY_USER_SUFFIX_NAME]
		);
		monthyProof["masterUserFirstName"] = this.commonUtilityService.capitalizeWords(monthyProof["masterUserFirstName"]);
		monthyProof["masterUserLastName"] = this.commonUtilityService.capitalizeWords(monthyProof["masterUserLastName"]);
		monthyProof["masterUserMiddleName"] = this.commonUtilityService.capitalizeWords(monthyProof["masterUserMiddleName"]);
		monthyProof["masterUserSuffixName"] = this.commonUtilityService.capitalizeWords(monthyProof["masterUserSuffixName"]);
		monthyProof[VariablesConstant.TRANSACTION_DATE] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			monthyProof[VariablesConstant.TRANSACTION_DATE],
			dateTimeFormat
		);
		monthyProof[VariablesConstant.VALID_FROM] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			monthyProof[VariablesConstant.VALID_FROM],
			dateFormat
		);
		monthyProof[VariablesConstant.VALID_TO] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			monthyProof[VariablesConstant.VALID_TO],
			dateFormat
		);
		monthyProof["uploadedDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			monthyProof["uploadedDate"],
			dateTimeFormat
		);
		monthyProof["approvedDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			monthyProof["approvedDate"],
			dateTimeFormat
		);
		monthyProof["verifiedAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			monthyProof["verifiedAt"],
			dateTimeFormat
		);
		monthyProof["monthlyProofAmount"] = this.commonUtilityService.formatCurrency(
			currencyFormattingData,
			monthyProof["monthlyProofAmount"]
		);
		monthyProof["rentAmount"] = this.commonUtilityService.formatCurrency(
			currencyFormattingData,
			monthyProof["rentAmount"]
		);
		monthyProof["monthlyProofTxnId"] = JSON.parse(monthyProof["monthlyProofTxnId"]);
		monthyProof["primaryUserMobileNo"] = this.commonUtilityService.formatMobileNumber(
			monthyProof["primaryUserMobileNo"],
			phonePermission
		);
		monthyProof["primaryUserEmail"] = this.commonUtilityService.formatEmail(
			monthyProof["primaryUserEmail"],
			emailPermission
		);
		const respnose = {
			rentDetails,
			...monthyProof
		};
		return respnose;
	}

	updateMasterProofDetails(approvedProofs, dateTimeFormat, currencyFormattingData) {
		let approvedAmount = 0;
		approvedProofs.forEach((approvedProof) => {
			approvedAmount = approvedAmount + +approvedProof["verifiedProofAmount"];
			approvedProof[VariablesConstant.VERIFY_USER_FIRST_NAME] = this.commonUtilityService.capitalizeWords(
				approvedProof[VariablesConstant.VERIFY_USER_FIRST_NAME]
			);
			approvedProof[VariablesConstant.VERIFY_USER_LAST_NAME] = this.commonUtilityService.capitalizeWords(
				approvedProof[VariablesConstant.VERIFY_USER_LAST_NAME]
			);
			approvedProof[VariablesConstant.VERIFY_USER_MIDDLE_NAME] = this.commonUtilityService.capitalizeWords(
				approvedProof[VariablesConstant.VERIFY_USER_MIDDLE_NAME]
			);
			approvedProof[VariablesConstant.VERIFY_USER_SUFFIX_NAME] = this.commonUtilityService.capitalizeWords(
				approvedProof[VariablesConstant.VERIFY_USER_SUFFIX_NAME]
			);
			approvedProof[VariablesConstant.TRANSACTION_DATE] =
				this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
					approvedProof[VariablesConstant.TRANSACTION_DATE],
					dateTimeFormat
				);
			approvedProof["verifiedProofAmount"] = this.commonUtilityService.formatCurrency(
				currencyFormattingData,
				approvedProof["verifiedProofAmount"]
			);
			approvedProof["verifiedProofPath"] = JSON.parse(approvedProof["verifiedProofPath"]);
			approvedProof["verifiedProofDetail"] = JSON.parse(approvedProof["verifiedProofDetail"]);

			if (approvedProof.masterProofType === MasterProofTypeEnum.PLAID) {
				approvedProof["verifiedProofDetail"]["personal_finance_category"]["detailed"] = approvedProof[
					"verifiedProofDetail"
				]["personal_finance_category"]["detailed"].replace(/_/g, " ");
				const cardDetails = JSON.parse(approvedProof["masterProofDetail"]);
				approvedProof.cardNumber = cardDetails?.mask ? `XXXX-XXXX-XXXX-${cardDetails?.mask}` : null;
			} else {
				approvedProof["verifiedProofDetail"] = JSON.parse(approvedProof["verifiedProofDetail"]);
				approvedProof["verifiedProofDetail"]["merchant_name"] = plaidTxnsData["creditors"];
				approvedProof["verifiedProofDetail"]["status"] = approvedProof["status"];
			}

			delete approvedProof["masterProofDetail"];
		});

		return {
			approvedAmount: this.commonUtilityService.formatCurrency(currencyFormattingData, approvedAmount),
			approvedProofs
		};
	}

	async formatPlaidTxnsDetails(
		configs: Map<string, string>,
		userInfo: UserMasterEntity,
		plaidTxnsData: any,
		userDetailModel: any,
		approvedProofs
	) {
		const dateTimeFormat = configs.get(ConfigCodeEnum.DEFAULT_DATETIME_FORMAT);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT);
		const currencyFormattingData = await this.commonUtilityService.getDataforCurrencyFormatting(configs);

		const rentDetails = this.updateMasterProofDetails(approvedProofs, dateTimeFormat, currencyFormattingData);
		const { phonePermission, emailPermission } = await this.commonUtilityService.getPiiPermissionData(
			userDetailModel?.userId
		);
		userInfo.firstName = this.commonUtilityService.capitalizeWords(userInfo.firstName);
		userInfo.middleName = this.commonUtilityService.capitalizeWords(userInfo.middleName);
		userInfo.lastName = this.commonUtilityService.capitalizeWords(userInfo.lastName);

		userInfo.mobileNo = this.commonUtilityService.formatMobileNumber(userInfo.mobileNo, phonePermission);
		userInfo.emailId = this.commonUtilityService.formatEmail(userInfo.emailId, emailPermission);
		plaidTxnsData["amount"] = this.commonUtilityService.formatCurrency(currencyFormattingData, plaidTxnsData["amount"]);

		plaidTxnsData["modifiedAmount"] = this.commonUtilityService.formatCurrency(
			currencyFormattingData,
			plaidTxnsData["modifiedAmount"]
		);
		plaidTxnsData[VariablesConstant.VALID_FROM] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			plaidTxnsData[VariablesConstant.VALID_FROM],
			dateFormat
		);
		plaidTxnsData[VariablesConstant.VALID_TO] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			plaidTxnsData[VariablesConstant.VALID_TO],
			dateFormat
		);

		const respnose = {
			rentDetails,
			...userInfo,
			...plaidTxnsData
		};
		return respnose;
	}

	async updateVerifiedMonthlyProofs(
		monthlyProofData: ValidationDocMonthlyProof,
		proofDetailObj,
		transactionIds: string[],
		queryRunner: QueryRunner,
		refdocId: number,
		masterProofData: ValidationDocMasterProof,
		txnIdToDataMapping
	) {
		const schedule = await this.monthlyDocDaoService.getScheduleIdFromPaymentSchedule(
			refdocId,
			monthlyProofData.reportingMonth,
			monthlyProofData.reportingYear
		);

		const verifiedMonthlyProofsArr: MonthlyVerifiedProofsEntity[] = [];
		await this.validateTxnId(transactionIds, masterProofData);
		transactionIds.forEach((transactionId) => {
			const verifiedMonthlyProofs = new MonthlyVerifiedProofsEntity(
				monthlyProofData.userId,
				schedule.scheduleId,
				monthlyProofData.masterProofId,
				monthlyProofData.monthlyProofType,
				monthlyProofData.proofPath,
				txnIdToDataMapping[transactionId]?.date,
				JSON.stringify(proofDetailObj[transactionId])
			);
			verifiedMonthlyProofs.fiRefNo = transactionId;
			verifiedMonthlyProofs.approvedAmount = txnIdToDataMapping[transactionId]?.amount;
			verifiedMonthlyProofs.reportingMonth = monthlyProofData.reportingMonth;
			verifiedMonthlyProofs.reportingYear = monthlyProofData.reportingYear;
			verifiedMonthlyProofs.verifiedAt = new Date();
			verifiedMonthlyProofs.verifiedBy = monthlyProofData.verifiedBy;
			verifiedMonthlyProofs.status = VerifiedProofStatusEnum.APPROVED;
			verifiedMonthlyProofsArr.push(verifiedMonthlyProofs);
		});
		await this.monthlyDocDaoService.saveVerifiedMonthlyProofFromQueryRunner(queryRunner, verifiedMonthlyProofsArr);
	}

	async handleApprovedMonthlyProofs(
		monthlyAndMasterProofData,
		transactionIds: string[],
		transactionDate: Date,
		approveMonthlyProofDto: ApproveMonthlyProofDto
	) {
		let { veriDocType } = approveMonthlyProofDto;
		const monthlyProofData = monthlyAndMasterProofData.monthlyProofData;
		const amount = monthlyAndMasterProofData.amount;

		if (!transactionDate) {
			throw new HttpException({ status: ResponseData.INVALID_TRANSACTION_DATE }, HttpStatus.OK);
		}
		let proofDetail;
		if (JSON.parse(monthlyProofData.proofDetail)) {
			proofDetail = JSON.parse(monthlyProofData.proofDetail);
		} else {
			proofDetail = {};
		}
		const paymentTypeData = await this.docDaoService.getPaymentTypeNameByPaymentType(veriDocType);
		proofDetail["paymentType"] = paymentTypeData.docTypeName;
		if (veriDocType === PaymentTypeCodeEnum.CHEQUE) {
			const { proofOfPayment, amountReceiver, routingNumber, accountingNumber } = approveMonthlyProofDto;
			proofDetail["proofOfPayment"] = proofOfPayment;
			proofDetail["amountReceiver"] = amountReceiver;
			proofDetail["routingNumber"] = routingNumber;
			proofDetail["accountingNumber"] = accountingNumber;
		} else if (veriDocType === PaymentTypeCodeEnum.MO) {
			const { amountReceiver, paymentType, bankName, moneyOrderSource } = approveMonthlyProofDto;
			proofDetail["amountReceiver"] = amountReceiver;
			proofDetail["subPaymentType"] = paymentType;
			proofDetail["bankName"] = bankName;
			proofDetail["moneyOrderSource"] = moneyOrderSource;
		}
		monthlyProofData.proofDetail = JSON.stringify(proofDetail);

		const fiRefNo = JSON.parse(monthlyProofData.fiRefNo);
		let transactionIdArr;
		if (fiRefNo) {
			transactionIds.forEach((txnId) => {
				if (fiRefNo.includes(txnId)) {
					throw new HttpException({ status: ResponseData.INVALID_TRANSACTION_ID }, HttpStatus.OK);
				}
			});
			transactionIdArr = [...fiRefNo, ...transactionIds];
		} else {
			transactionIdArr = [...transactionIds];
		}
		monthlyProofData.fiRefNo = JSON.stringify(transactionIdArr);
		monthlyProofData.amount = amount;
		monthlyProofData.transactionDate = transactionDate;
	}

	verifyReceipt(receipt, status: MonthlyProofStatusEnum, rejectionReasonId: number) {
		const receiptObjArr = JSON.parse(receipt);
		receiptObjArr.forEach((receiptObj) => {
			if (receiptObj["status"] === ReceiptStatusEnum.REQUESTED) {
				if (status === MonthlyProofStatusEnum.QUALIFIED) {
					receiptObj["status"] = ReceiptStatusEnum.APPROVED;
				} else if (rejectionReasonId === 4) {
					receiptObj["status"] = ReceiptStatusEnum.REJECTED;
				}
				receiptObj["verifiedDate"] = new Date();
			}
		});
		return receiptObjArr;
	}

	async updateCreditor(refdocId, creditor: string, queryRunner: QueryRunner) {
		const refdocData = await this.docDaoService.getRefdocById(refdocId);
		const refdocs = await this.docDaoService.getRefdocDataByAddressAndZip(refdocData.addressTwo, refdocData.zip);

		const creditorUpdatesAsyncArr: CreditorUpdatesAsync[] = [];
		refdocs.forEach((refdoc) => {
			let creditorArr;
			if (refdoc.creditors) {
				creditorArr = JSON.parse(refdoc.creditors);
				if (!creditorArr.includes(creditor)) {
					creditorArr.push(creditor);
				}
				refdoc.creditors = JSON.stringify(creditorArr);
			} else {
				creditorArr = [];
				creditorArr.push(creditor);
				refdoc.creditors = JSON.stringify(creditorArr);
			}
			if (refdoc.refdocId !== refdocData.refdocId) {
				const creditorUpdatesAsync = new CreditorUpdatesAsync(
					refdoc.refdocId,
					CreditorActionEnum.ASSIGN,
					StatusEnum.NEW,
					0,
					creditor
				);
				creditorUpdatesAsyncArr.push(creditorUpdatesAsync);
			}
		});
		if (creditorUpdatesAsyncArr.length) {
			await this.monthlyDocDaoService.saveMultipleCreditorUpdatesAsync(creditorUpdatesAsyncArr, queryRunner);
		}
		await this.docDaoService.saveMultipleRefdocMastersByQueryRunner(queryRunner, refdocs);
	}

	async removeCreditor(refdocId, nonCreditor: string, queryRunner: QueryRunner) {
		const refdocData = await this.docDaoService.getRefdocById(refdocId);
		const refdocs = await this.docDaoService.getRefdocDataByAddressAndZip(refdocData.addressTwo, refdocData.zip);
		const creditorUpdatesAsyncArr: CreditorUpdatesAsync[] = [];
		refdocs.forEach((refdoc) => {
			let creditorArr;
			if (refdoc.creditors) {
				creditorArr = JSON.parse(refdoc.creditors);
				if (creditorArr.includes(nonCreditor)) {
					creditorArr = creditorArr.filter((creditor) => creditor !== nonCreditor);
				}
				refdoc.creditors = JSON.stringify(creditorArr);
			}
			if (refdoc.refdocId !== refdocData.refdocId) {
				const creditorUpdatesAsync = new CreditorUpdatesAsync(
					refdoc.refdocId,
					CreditorActionEnum.REJECT,
					StatusEnum.NEW,
					0,
					nonCreditor
				);
				creditorUpdatesAsyncArr.push(creditorUpdatesAsync);
			}
		});
		if (creditorUpdatesAsyncArr.length) {
			await this.monthlyDocDaoService.saveMultipleCreditorUpdatesAsync(creditorUpdatesAsyncArr, queryRunner);
		}
		await this.docDaoService.saveMultipleRefdocMastersByQueryRunner(queryRunner, refdocs);
	}

	async updateNonCreditor(refdocId: number, nonCreditor: string) {
		if (nonCreditor) {
			let leaseSpecificNonCreditorList = await this.monthlyDocDaoService.getLeaseSpecificNonCreditorByCreditor(
				+refdocId,
				nonCreditor
			);

			if (leaseSpecificNonCreditorList) {
				leaseSpecificNonCreditorList.confidenceScore += 1;
				leaseSpecificNonCreditorList.updatedAt = new Date();
			} else {
				leaseSpecificNonCreditorList = new LeaseSpecificNonCreditorList(+refdocId, nonCreditor, 1);
			}
			await this.monthlyDocDaoService.saveLeaseSpecificNonCreditorList(leaseSpecificNonCreditorList);
		}
	}

	async removeNonCreditor(creditor: string, refdocId: number, queryRunner: QueryRunner) {
		const leaseSpecificNonCreditor = await this.monthlyDocDaoService.getLeaseSpecificNonCreditorByCreditor(
			+refdocId,
			creditor
		);
		if (leaseSpecificNonCreditor) {
			if (leaseSpecificNonCreditor.confidenceScore > 0) {
				leaseSpecificNonCreditor.confidenceScore -= 1;
				await this.monthlyDocDaoService.saveLeaseSpecificNonCreditorListFromQueryRunner(
					queryRunner,
					leaseSpecificNonCreditor
				);
			}
		}
	}

	async removeCreditorFromRefdoc(creditor: string, masterProofId: number, queryRunner: QueryRunner) {
		const refdocData = await this.docDaoService.getRefdocDataByMasterProofId(masterProofId);
		const refdoc = await this.docDaoService.getRefdocById(refdocData.refdocId);
		const refdocs = await this.docDaoService.getRefdocDataByAddressAndZip(refdoc.addressTwo, refdoc.zip);
		const refdocArr: RefdocMaster[] = [];
		refdocs.forEach((ref) => {
			let creditorArr = JSON.parse(ref.creditors);
			const newCreditorArr = creditorArr.filter((data) => data !== creditor);
			if (newCreditorArr.length) {
				creditorArr = JSON.stringify(newCreditorArr);
			} else {
				creditorArr = null;
			}
			ref.creditors = creditorArr;
			refdocArr.push(ref);
		});

		await this.docDaoService.saveMultipleRefdocMastersByQueryRunner(queryRunner, refdocArr);
	}

	async formatPlaidTxns(mongoPlaidTxns: MongoPlaidData[], currencyFormattingData, dateTimeFormat) {
		mongoPlaidTxns.sort((a, b) => {
			if (
				a["plaidData"]["personal_finance_category"]["detailed"] === DetailedConstants[0] &&
				b["plaidData"]["personal_finance_category"]["detailed"] !== DetailedConstants[0]
			) {
				return -1;
			} else if (
				a["plaidData"]["personal_finance_category"]["detailed"] !== DetailedConstants[0] &&
				b["plaidData"]["personal_finance_category"]["detailed"] === DetailedConstants[0]
			) {
				return 1;
			} else {
				return 0;
			}
		});
		for (const txn of mongoPlaidTxns) {
			txn.status = (await this.monthlyDocDaoService.getStatusDisplayNameFromDropdownTable(txn.status)) as any;
			txn.plaidData["formattedAmount"] = this.commonUtilityService.formatCurrency(
				currencyFormattingData,
				txn.plaidData["amount"]
			);
			txn["plaidData"]["personal_finance_category"]["detailed"] = txn["plaidData"]["personal_finance_category"][
				"detailed"
			].replace(/_/g, " ");
			txn["plaidData"]["date"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				txn["plaidData"]["date"],
				dateTimeFormat
			);
			txn.plaidData["statusDesc"] = await this.monthlyDocDaoService.getStatusDisplayNameFromDropdownTable(
				txn?.plaidData["status"]
			);
			delete txn?.plaidData["counterparties"];
		}
	}

	async formatVerifiedProofs(configs: Map<string, string>, verifiedProofs: any[], paymentSchedule: PaymentSchedule) {
		const dateTimeFormat = configs.get(ConfigCodeEnum.DEFAULT_DATETIME_FORMAT) || "MM-DD-YYYY";
		const currencyFormattingData = await this.commonUtilityService.getDataforCurrencyFormatting(configs);
		let verifiedRentAmount: any = 0;
		verifiedProofs.forEach((proof) => {
			verifiedRentAmount = verifiedRentAmount + +proof["approvedAmount"];
			proof["approvedAmount"] = this.commonUtilityService.formatCurrency(
				currencyFormattingData,
				proof["approvedAmount"]
			);
			proof[VariablesConstant.TRANSACTION_DATE] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				proof[VariablesConstant.TRANSACTION_DATE],
				dateTimeFormat
			);
			proof["payeeName"] = this.commonUtilityService.capitalizeWords(proof["payeeName"]);
		});
		let rentAmount: any = paymentSchedule.modifiedAmount ? paymentSchedule.modifiedAmount : paymentSchedule.amount;
		rentAmount = this.commonUtilityService.formatCurrency(currencyFormattingData, rentAmount);
		verifiedRentAmount = this.commonUtilityService.formatCurrency(currencyFormattingData, verifiedRentAmount);
		return {
			proofs: verifiedProofs.length ? verifiedProofs : null,
			verifiedRentAmount,
			rentAmount,
			rentStatus: paymentSchedule.status
		};
	}

	async getCreditorByTxnIds(transactionIds: string[]) {
		let nonCreditor;
		const plaidTxn = await this.mongoDaoService.getMongoPlaidDataByTxnIds("transaction_id", transactionIds);
		if (!plaidTxn) {
			throw new HttpException({ status: ResponseData.INVALID_TRANSACTION_ID }, HttpStatus.OK);
		}
		plaidTxn.map((txn) => {
			if (txn.plaidData["merchant_name"]) {
				nonCreditor = txn.plaidData["merchant_name"];
			} else {
				throw new HttpException({ status: ResponseData.NO_MERCHANT_NAME }, HttpStatus.OK);
			}
		});
		return nonCreditor;
	}

	async getFilteredMongoTxns(
		plaidTxnStatus,
		monthMatchingStatus,
		paymentMonth,
		paymentYear,
		requiredPlaidTxnData,
		userIds
	) {
		let mongoTxns;
		const masterProofIds = [];
		let newPlaidTxnStatus;
		if (plaidTxnStatus === PlaidTxnStatus.QUALIFIED) {
			newPlaidTxnStatus = [PlaidTxnStatus.CRYREMP_QUALIFIED, PlaidTxnStatus.CRYRBOT_QUALIFIED];
		} else if (plaidTxnStatus === PlaidTxnStatus.REJECTED) {
			newPlaidTxnStatus = [PlaidTxnStatus.CRYRBOT_REJECTED, PlaidTxnStatus.CRYREMP_REJECTED];
		} else {
			newPlaidTxnStatus = [plaidTxnStatus];
		}
		mongoTxns = await this.mongoDaoService.getMongoPlaidDataForCreditorPayPage(
			newPlaidTxnStatus,
			monthMatchingStatus,
			paymentMonth,
			paymentYear
		);
		if (!mongoTxns.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		for (const txn of mongoTxns) {
			if (!masterProofIds.includes(txn.masterProofId)) {
				masterProofIds.push(txn.masterProofId);
			}
			const requiredPlaidDataObj = {};
			requiredPlaidDataObj["monthMatchingStatus"] = txn.monthMatching;
			requiredPlaidDataObj["creditorMatchingStatus"] = txn.status;
			requiredPlaidDataObj["creditorMatchingStatusName"] =
				await this.monthlyDocDaoService.getStatusDisplayNameFromDropdownTable(txn.status);
			if (
				(txn.status === PlaidTxnStatus.CRYREMP_QUALIFIED || txn.status === PlaidTxnStatus.CRYRBOT_QUALIFIED) &&
				(txn.monthMatching == MonthMatchingStatus.CRYRBOT_ASSIGNED ||
					txn.monthMatching == MonthMatchingStatus.CRYREMP_ASSIGNED)
			) {
				requiredPlaidDataObj["paymentMonth"] = txn.month + " " + txn.year.toString();
			} else {
				const txnDate = new Date(txn.plaidData["date"]);
				const txnMonthName = MonthMapEnum[(txnDate.getMonth() + 1).toString()];
				const txnYear = txnDate.getFullYear();
				requiredPlaidDataObj["paymentMonth"] = txnMonthName + " " + txnYear.toString();
			}
			requiredPlaidTxnData[txn.refdocId] = requiredPlaidDataObj;
		}

		const masterProofs = await this.docDaoService.getDocMasterProofDataByIdsAndStatus(
			masterProofIds,
			ProofStatus.APPROVED
		);

		masterProofs.forEach((proof) => {
			if (!userIds.includes(proof.userId)) {
				userIds.push(proof.userId);
			}
		});
	}

	async createPaymentScheduleAndFilterTxns(plaidTxnStatus, refdocId, paymentSchedule, mongoPlaidTxns, month, year) {
		if (plaidTxnStatus === PlaidTxnStatus.NO_CREDITOR) {
			const paymentSchedules = await this.docDaoService.getPaymentScheduleByRefdocId(refdocId);
			for (const schedule of paymentSchedules) {
				const subscription = await this.packageDaoService.getSubscriptionForMonthAndYearForRefdoc(
					schedule.leaseId,
					schedule.reportingMonth,
					schedule.reportingYear
				);
				if (subscription) {
					paymentSchedule = schedule;
					break;
				}
			}
		} else {
			paymentSchedule = await this.docDaoService.getPaymentScheduleByMonthYearAndRefdoc(refdocId, month, year);
		}
		if (paymentSchedule.modifiedAmount) {
			paymentSchedule.amount = paymentSchedule.modifiedAmount;
		}
		const refdocParticipants = await this.docDaoService.getRefdocParticipantsByRefdocId(refdocId);
		const paymentMappingRequest = await this.participantDaoService.getPaymentUserDataByRefdocId(refdocId);
		let participantCount;
		if (refdocParticipants) {
			participantCount = +refdocParticipants.refdocParticipantCount;
		} else {
			participantCount = 0;
		}
		const newMongoPlaidTxns = mongoPlaidTxns.filter((txn) => {
			if (
				!paymentMappingRequest.length &&
				participantCount < 1 &&
				+txn.plaidData["amount"] < +paymentSchedule.modifiedAmount
			) {
				return false;
			}

			return true;
		});

		return newMongoPlaidTxns;
	}

	async createDateRanges(
		plaidTxnStatus: PlaidTxnStatus,
		paymentSchedule,
		requiredDataObj,
		firstFetchFrom,
		qualifiedTxns,
		approvedTxnDateBeforeSelectedMonth,
		mongoPlaidTxns
	) {
		const { refdocId, latestApprovedTxnDate, monthMatchingStatus } = requiredDataObj;
		let allowedFromDate, defaultFromDate, defaultToDate, allowedToDate, txnActionBtnHide, newMongoPlaidTxns;
		if (plaidTxnStatus === PlaidTxnStatus.NO_CREDITOR) {
			const dueDate = new Date(paymentSchedule.dueDate);
			const currentDate = new Date();
			allowedFromDate = new Date(dueDate);
			allowedFromDate.setDate(allowedFromDate.getDate() - 45);
			defaultFromDate = new Date(dueDate);
			defaultFromDate.setDate(defaultFromDate.getDate() - 5);
			defaultToDate = new Date(currentDate);
			defaultToDate.setDate(defaultToDate.getDate() - 1);
			allowedToDate = defaultToDate;
		} else if (plaidTxnStatus === PlaidTxnStatus.NO_MATCHING_CREDITOR) {
			const dueDate = new Date(paymentSchedule.dueDate);

			const nextMonthDate = new Date(dueDate);
			nextMonthDate.setMonth(dueDate.getMonth() + 1);
			const nextMonthYear = nextMonthDate.getFullYear();
			const nextMonth = MonthMapEnum[(nextMonthDate.getMonth() + 1).toString()];

			const nextMonthPaymentSchedule = await this.docDaoService.getPaymentScheduleByMonthYearAndRefdoc(
				refdocId,
				nextMonth,
				nextMonthYear
			);
			const nextMonthDueDate = new Date(nextMonthPaymentSchedule.dueDate);
			const currentDate = new Date();

			if (latestApprovedTxnDate) {
				allowedFromDate = latestApprovedTxnDate;
			} else {
				allowedFromDate = firstFetchFrom;
			}

			if (dueDate.getTime() > currentDate.getTime()) {
				defaultFromDate = allowedFromDate;
			} else {
				defaultFromDate = new Date(dueDate);
				defaultFromDate.setDate(defaultFromDate.getDate() - 5);
			}

			allowedToDate = new Date(nextMonthDueDate);
			allowedToDate.setDate(allowedToDate.getDate() - 1);
			defaultToDate = new Date(currentDate);
			defaultToDate.setDate(defaultToDate.getDate() - 1);
		} else if (
			plaidTxnStatus === PlaidTxnStatus.CRYRBOT_REJECTED ||
			plaidTxnStatus === PlaidTxnStatus.CRYREMP_REJECTED ||
			plaidTxnStatus === PlaidTxnStatus.REJECTED
		) {
			const paymentDueDate = new Date(paymentSchedule.paymentDueDate);
			if (qualifiedTxns.length) {
				txnActionBtnHide = true;
			} else {
				txnActionBtnHide = false;
			}
			allowedFromDate = approvedTxnDateBeforeSelectedMonth;
			defaultFromDate = approvedTxnDateBeforeSelectedMonth;
			defaultToDate = new Date(paymentDueDate);
			defaultToDate.setDate(defaultToDate.getDate() + 10);
			allowedToDate = new Date();
			allowedToDate.setDate(allowedToDate.getDate() - 1);
		} else {
			allowedFromDate = null;
			allowedToDate = null;
			defaultFromDate = null;
			defaultToDate = null;
			newMongoPlaidTxns = this.filterMongoTxnsByMonthMatchingStatus(monthMatchingStatus, mongoPlaidTxns);
		}
		return { txnActionBtnHide, allowedFromDate, defaultFromDate, defaultToDate, allowedToDate, newMongoPlaidTxns };
	}

	filterMongoTxnsByMonthMatchingStatus(monthMatchingStatus, mongoPlaidTxns) {
		let newMongoPlaidTxns;
		if (monthMatchingStatus === MonthMatchingStatus.UNASSIGNED) {
			newMongoPlaidTxns = mongoPlaidTxns.filter((txn) => {
				return txn.monthMatching === MonthMatchingStatus.UNASSIGNED;
			});
		} else {
			newMongoPlaidTxns = mongoPlaidTxns.filter((txn) => {
				return txn.monthMatching !== MonthMatchingStatus.UNASSIGNED;
			});
		}
		return newMongoPlaidTxns;
	}

	async validateTxnId(transactionIds, masterProofData) {
		for (const txnId of transactionIds) {
			const isTransactionid = await this.monthlyDocDaoService.getMonthlyVerifiedProofsByTransactionIdAndPaymentType(
				txnId,
				masterProofData.paymentType
			);
			if (isTransactionid && masterProofData.paymentType === PaymentTypeCodeEnum.CHEQUE) {
				throw new HttpException({ status: ResponseData.INVALID_CHECK_NUMBER }, HttpStatus.OK);
			} else if (isTransactionid && masterProofData.paymentType === PaymentTypeCodeEnum.MO) {
				throw new HttpException({ status: ResponseData.INVALID_MONEY_ORDER_NUMBER }, HttpStatus.OK);
			} else if (isTransactionid && masterProofData.paymentType === PaymentTypeCodeEnum.FLEX) {
				throw new HttpException({ status: ResponseData.INVALID_FLEX_AGREEMENT_NUMBER }, HttpStatus.OK);
			} else if (
				isTransactionid &&
				(masterProofData.paymentType === PaymentTypeCodeEnum.CC ||
					masterProofData.paymentType === PaymentTypeCodeEnum.DC)
			) {
				throw new HttpException({ status: ResponseData.INVALID_TRANSACTION_ID }, HttpStatus.OK);
			}
		}
	}

	async updateMongoTxnsForRejection(mongoPlaidTxns, nonCreditor, txnsForRejectionObj, refdocId) {
		const txnsAndScheduleObj = {};

		for (const txn of mongoPlaidTxns) {
			if (txn.plaidData?.["merchant_name"] && txn.plaidData?.["merchant_name"] === nonCreditor) {
				if (txn.scheduleStatus !== ScheduleStatusEnum.UPDATED) {
					txn.plaidData["status"] = PlaidTxnStatus.CRYREMP_REJECTED;
					txn.status = PlaidTxnStatus.CRYREMP_REJECTED;
				} else if (!Object.keys(txnsForRejectionObj).includes(`${txn.month}-${txn.year}`)) {
					const scheduleInfo = await this.docDaoService.getPaymentScheduleByMonthYearAndRefdocId(
						refdocId,
						txn.month,
						txn.year
					);
					scheduleInfo["status"] = scheduleInfo["statusDesc"];
					txnsAndScheduleObj["scheduleInfo"] = scheduleInfo;
					txnsAndScheduleObj["scheduleInfo"]["txns"] = [];
					txnsAndScheduleObj["scheduleInfo"]["txns"].push(txn);
					txnsForRejectionObj[`${txn.month}-${txn.year}`] = txnsAndScheduleObj;
				} else {
					txnsForRejectionObj[`${txn.month}-${txn.year}`]["scheduleInfo"]["txns"].push(txn);
				}
			}
		}
	}

	filterMongoPlaidTxnsForSelectedPlaidTxns(mongoPlaidTxns, nonCreditor) {
		const newMongoPlaidTxns = mongoPlaidTxns.filter((txn) => {
			if (
				txn.plaidData?.["merchant_name"] &&
				txn.plaidData?.["merchant_name"] === nonCreditor &&
				txn.scheduleStatus !== ScheduleStatusEnum.UPDATED
			) {
				txn.plaidData["status"] = PlaidTxnStatus.CRYREMP_REJECTED;
				txn.status = PlaidTxnStatus.CRYREMP_REJECTED;
				return true;
			} else {
				return false;
			}
		});
		return newMongoPlaidTxns;
	}

	createMasterProofIdsAndTxnsForMasterProofIds(txnInfo, masterProofIds, txnsForMasterProofIds) {
		txnInfo["scheduleInfo"]["txns"].forEach((txn) => {
			masterProofIds.push(txn.masterProofId);
			if (!txnsForMasterProofIds[txn.masterProofId]) {
				txnsForMasterProofIds[txn.masterProofId] = [];
				txnsForMasterProofIds[txn.masterProofId].push(txn.plaidData["transaction_id"]);
			} else {
				txnsForMasterProofIds[txn.masterProofId].push(txn.plaidData["transaction_id"]);
			}
		});
	}

	async handleRejectionForPartiallyUploaded(
		monthlyProof: ValidationDocMonthlyProof,
		refdocId,
		txnInfo,
		queryRunner: QueryRunner,
		proof
	) {
		monthlyProof.status = MonthlyProofStatusEnum.DATA_FETCH_PENDING;
		const plaidTxns = await this.mongoDaoService.getMongoPlaidDataByRefdocIdMonthYearAndScheduleStatus(
			refdocId,
			txnInfo["scheduleInfo"]["month"],
			+txnInfo["scheduleInfo"]["year"]
		);
		if (!plaidTxns.length) {
			throw new HttpException({ status: ResponseData.NO_PLAID_TXNS_FOUND }, HttpStatus.OK);
		}
		let transactionIdsArr = [];
		plaidTxns.forEach((txn) => {
			if (txn?.plaidData["transaction_id"] === proof.fiRefNo) {
				txn.scheduleStatus = ScheduleStatusEnum.NOT_UPDATED;
				txn.plaidData["status"] = PlaidTxnStatus.CRYREMP_REJECTED;
				txn.status = PlaidTxnStatus.CRYREMP_REJECTED;
				monthlyProof.amount -= +txn.plaidData["amount"];
				let creditors = JSON.parse(monthlyProof.creditors);
				if (creditors.includes(txn.plaidData["merchant_name"])) {
					creditors = creditors.filter((creditor) => {
						return creditor !== txn.plaidData["merchant_name"];
					});
					monthlyProof.creditors = JSON.stringify(creditors);
				}
			}
			if (txn?.scheduleStatus === ScheduleStatusEnum.UPDATED) {
				monthlyProof.status = MonthlyProofStatusEnum.PARTIALLY_APPROVED;
				transactionIdsArr.push(txn?.plaidData["transaction_id"]);
			}
		});
		monthlyProof.fiRefNo = JSON.stringify(transactionIdsArr);
		await this.monthlyDocDaoService.saveMonthlyProofDocFromQueryRunner(queryRunner, monthlyProof);
		await this.mongoDaoService.saveMongoPlaidData(plaidTxns);
	}

	async handleRejectionForReadyForReportingOrLatePayment(
		masterProofId: number,
		proof,
		monthlyProof: ValidationDocMonthlyProof,
		queryRunner: QueryRunner
	) {
		const plaidTxn = await this.mongoDaoService.getMongoPlaidDataByMasterProofIdAndTxnId(
			"transaction_id",
			masterProofId,
			proof.fiRefNo
		);
		if (!plaidTxn) {
			throw new HttpException({ status: ResponseData.NO_PLAID_TXNS_FOUND }, HttpStatus.OK);
		}
		plaidTxn.scheduleStatus = ScheduleStatusEnum.NOT_UPDATED;
		plaidTxn.plaidData["status"] = PlaidTxnStatus.CRYREMP_REJECTED;
		plaidTxn.status = PlaidTxnStatus.CRYREMP_REJECTED;
		monthlyProof.amount -= +plaidTxn.plaidData["amount"];
		let creditors = JSON.parse(monthlyProof.creditors);
		if (creditors.includes(plaidTxn.plaidData["merchant_name"])) {
			creditors = creditors.filter((creditor) => {
				return creditor !== plaidTxn.plaidData["merchant_name"];
			});
			monthlyProof.creditors = JSON.stringify(creditors);
		}
		await this.monthlyDocDaoService.saveMonthlyProofDocFromQueryRunner(queryRunner, monthlyProof);
		await this.mongoDaoService.saveSingleMongoPlaidData(plaidTxn);
	}

	async handleRejectionForDue(monthlyProof: ValidationDocMonthlyProof, masterProofId, proof, queryRunner: QueryRunner) {
		monthlyProof.status = MonthlyProofStatusEnum.DATA_FETCH_PENDING;
		await this.handleRejectionForReadyForReportingOrLatePayment(masterProofId, proof, monthlyProof, queryRunner);
	}

	async rejectPlaidTxnsByPaymentScheduleStatus(
		monthlyProof: ValidationDocMonthlyProof,
		newPaymentScheduleStatus,
		refdocId,
		txnInfo,
		proof,
		masterProofId,
		queryRunner: QueryRunner
	) {
		if (monthlyProof) {
			if (newPaymentScheduleStatus === PaymentScheduleStatus.PARTIALLY_UPLOADED) {
				await this.handleRejectionForPartiallyUploaded(monthlyProof, refdocId, txnInfo, queryRunner, proof);
			} else if (
				newPaymentScheduleStatus === PaymentScheduleStatus.READY_FOR_REPORTING ||
				newPaymentScheduleStatus === PaymentScheduleStatus.LATE_PAYMENT
			) {
				await this.handleRejectionForReadyForReportingOrLatePayment(masterProofId, proof, monthlyProof, queryRunner);
			} else if (newPaymentScheduleStatus === PaymentScheduleStatus.DUE) {
				await this.handleRejectionForDue(monthlyProof, masterProofId, proof, queryRunner);
			}
			await this.monthlyDocDaoService.saveVerifiedMonthlyProofFromQueryRunner(queryRunner, [proof]);
		}
	}
}
