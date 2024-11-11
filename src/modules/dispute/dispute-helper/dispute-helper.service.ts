import {
	DisputeEventParams,
	InboxDeepLinkParams,
	KafkaEventMessageDto,
	KafkaEventTypeEnum
} from "@kafka/dto/kafka-event-message.dto";
import { NotificationProducerService } from "@kafka/producer/notification-producer/notification-producer-service";
import { DisputeDaoService } from "@modules/dao/dispute-dao/dispute-dao.service";
import { DocDaoService } from "@modules/dao/doc-dao/doc-dao.service";
import { MonthlyDocDaoService } from "@modules/dao/monthly-doc-dao/monthly-doc-dao.service";
import { MonthlyVerifiedProofsEntity } from "@modules/monthly-proof/entities/monthly-proof-verified.entity";
import { ValidationDocMonthlyProof } from "@modules/monthly-proof/entities/validation-doc-monthly-proof.entity";
import { MonthlyProofHelperService } from "@modules/monthly-proof/monthly-Proof-helper/monthlyProof-helper.service";
import { UserMasterEntity } from "@modules/user-master/entities/user-master.entity";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CommonUtilityService } from "@utils/common/common-utility/common-utility.service";
import { ConfigurationService } from "@utils/configuration/configuration.service";
import { MonthlyProofStatusEnum, ReceiptStatusEnum, VerifiedProofStatusEnum, YNStatusEnum } from "@utils/enums/Status";
import { ConfigCodeEnum } from "@utils/enums/constants";
import { QueryRunner } from "typeorm";
import { DisputeHistoryEntity, DisputeHistoryStatusEnum } from "../entities/dispute-history.entity";
import { ResponseData } from "@utils/enums/response";
import { DisputeEntity } from "../entities/dispute.entity";
import VariablesConstant from "@utils/variables-constant";

@Injectable()
export class DisputeHelperService {
	constructor(
		private readonly disputeDaoService: DisputeDaoService,
		private readonly commonUtilityService: CommonUtilityService,
		private readonly monthlyProofHelperService: MonthlyProofHelperService,
		private readonly monthlyDocDaoService: MonthlyDocDaoService,
		private notificationProducerService: NotificationProducerService,
		private readonly configurationService: ConfigurationService,
		private readonly docDaoService: DocDaoService
	) {}

	async getDisputeDataByDisputeId(disputeId: number, dateFormat: string, getPiiPermissionData: any) {
		const { phonePermission, emailPermission } = getPiiPermissionData;
		const disputeData = await this.disputeDaoService.getDisputeDataById(disputeId);
		disputeData["daysFromStatusUpdate"] = this.commonUtilityService.getDaysFromDateToToday(
			disputeData[VariablesConstant.DISPUTE_UPDATED_AT]
		);
		disputeData["daysFromDisputeStarted"] = this.commonUtilityService.getDaysFromDateToToday(disputeData["raisedAt"]);
		disputeData.raisedAt = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			disputeData.raisedAt,
			dateFormat
		);
		disputeData.disputeUpdatedAt = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			disputeData.disputeUpdatedAt,
			dateFormat
		);
		disputeData["customerSince"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			disputeData["customerSince"],
			dateFormat
		);
		disputeData[VariablesConstant.MOBILE_NO] = this.commonUtilityService.formatMobileNumber(
			disputeData[VariablesConstant.MOBILE_NO],
			phonePermission
		);
		disputeData[VariablesConstant.EMAIL_ID] = this.commonUtilityService.formatEmail(
			disputeData[VariablesConstant.EMAIL_ID],
			emailPermission
		);
		disputeData[VariablesConstant.RAISED_BY] = this.commonUtilityService.capitalizeWords(
			disputeData[VariablesConstant.RAISED_BY]
		);
		return disputeData;
	}

	async getDisputeDataByDisputeIdAndUserId(disputeId: number, userId: number, dateFormat: string, dateTimeFormat: string) {
		const disputeData = await this.disputeDaoService.getDisputeDataByIdAndRaisedById(disputeId, userId);
		disputeData.raisedAt = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			disputeData.raisedAt,
			dateFormat
		);
		disputeData.disputeUpdatedAt = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			disputeData.disputeUpdatedAt,
			dateTimeFormat
		);
		disputeData[VariablesConstant.MOBILE_NO] = this.commonUtilityService.formatMobileNumber(
			disputeData[VariablesConstant.MOBILE_NO]
		);
		disputeData[VariablesConstant.EMAIL_ID] = this.commonUtilityService.formatEmail(
			disputeData[VariablesConstant.EMAIL_ID]
		);
		disputeData[VariablesConstant.RAISED_BY] = this.commonUtilityService.capitalizeWords(
			disputeData[VariablesConstant.RAISED_BY]
		);
		const monthlyProofRequested = await this.monthlyDocDaoService.getmonthlyProofDocByDisputeIdAndStatus(disputeId, [
			MonthlyProofStatusEnum.REQUESTED,
			MonthlyProofStatusEnum.APPROVED,
			MonthlyProofStatusEnum.QUALIFIED
		]);
		if (monthlyProofRequested?.length > 1) {
			disputeData["docUpload"] = false;
		} else {
			disputeData["docUpload"] = true;
		}
		return disputeData;
	}

	async getDisputeHistoryDataByDisputeId(disputeId: number, dateTimeFormat: string, raisedById: number) {
		const disputeHistory = await this.disputeDaoService.getDisputeHistoryByDisputeId(disputeId);
		disputeHistory.forEach((dispute) => {
			dispute.createdAt = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				dispute.createdAt,
				dateTimeFormat
			);
			dispute.isUser = dispute.createdById == raisedById;
			dispute.createdBy = this.commonUtilityService.capitalizeWords(dispute.createdBy);
		});
		return disputeHistory;
	}

	async addMonthlyProofDataInDisputeHistory(disputeHistory, disputeId: number) {
		const monthlyProofs = await this.monthlyDocDaoService.getmonthlyProofDocByDisputeId(disputeId);
		const disputeHistoryMonthlyProofObj = {};
		monthlyProofs.forEach((proof) => {
			disputeHistoryMonthlyProofObj[proof.disputeHistoryId] = proof;
		});
		disputeHistory.forEach((history) => {
			if (disputeHistoryMonthlyProofObj[history.id]) {
				const monthlyProofData = disputeHistoryMonthlyProofObj[history.id];
				history["docStatus"] = monthlyProofData.status;
				history["docRejectionRemark"] = monthlyProofData.remark;
			}
		});
	}

	async validateDisputeIdByUser(disputeId: number, userId: number) {
		return await this.disputeDaoService.getActiveDisputeDataByIdAndRaisedById(disputeId, userId);
	}

	async getActiveDisputeData(disputeId: number) {
		return await this.disputeDaoService.getActiveDisputeDataByDisputId(disputeId);
	}

	async updatePaymentScheduleStatusByQueryRunner(
		queryRunner: QueryRunner,
		monthlyProof: ValidationDocMonthlyProof,
		transactionId: string
	) {
		const { refdocId } = await this.monthlyDocDaoService.getMonthlyProofTotalAmountByQueryRunner(
			queryRunner,
			monthlyProof.id
		);
		const paymentSchedule = await this.docDaoService.getPaymentScheduleByMonthYearAndRefdoc(
			refdocId,
			monthlyProof.reportingMonth,
			monthlyProof.reportingYear
		);
		const verifiedMonthlyProofs = new MonthlyVerifiedProofsEntity(
			monthlyProof.userId,
			paymentSchedule.id,
			monthlyProof.masterProofId,
			monthlyProof.monthlyProofType,
			monthlyProof.proofPath,
			monthlyProof.transactionDate,
			monthlyProof.proofDetail
		);
		verifiedMonthlyProofs.fiRefNo = transactionId;
		verifiedMonthlyProofs.approvedAmount = monthlyProof.amount;
		verifiedMonthlyProofs.reportingMonth = monthlyProof.reportingMonth;
		verifiedMonthlyProofs.reportingYear = monthlyProof.reportingYear;
		verifiedMonthlyProofs.verifiedAt = new Date();
		verifiedMonthlyProofs.verifiedBy = monthlyProof.verifiedBy;
		verifiedMonthlyProofs.status = VerifiedProofStatusEnum.APPROVED;

		await this.monthlyDocDaoService.saveVerifiedMonthlyProofFromQueryRunner(queryRunner, [verifiedMonthlyProofs]);
		const txnIdToDataMapping = {};
		txnIdToDataMapping[transactionId] = { date: monthlyProof.transactionDate, amount: monthlyProof.amount };
		await this.monthlyProofHelperService.updatePaymentScheduleStatusByQueryRunner(
			monthlyProof,
			refdocId,
			monthlyProof.amount,
			queryRunner,
			txnIdToDataMapping
		);
	}

	async sendDisputeUserEvent(
		userInfo: UserMasterEntity,
		disputeId: number,
		eventType: KafkaEventTypeEnum,
		aliasName: string,
		screenName: string,
		screenReferenceId: number
	) {
		const kafkaEventMessageDto = new KafkaEventMessageDto(
			aliasName,
			userInfo.currencyCode,
			userInfo.mobileVerified == YNStatusEnum.YES ? userInfo.mobileCode + userInfo.mobileNo : null,
			userInfo.emailVerified == YNStatusEnum.YES ? userInfo.emailId : null,
			userInfo.userType
		);
		kafkaEventMessageDto.addDetails(+userInfo.systemUserId, userInfo.businessId);
		const params: DisputeEventParams = {
			firstName: userInfo.firstName,
			lastName: userInfo.lastName,
			disputeID: disputeId
		};

		const inboxDeepLinkParams: InboxDeepLinkParams = {
			screenName,
			screenReferenceId
		};
		kafkaEventMessageDto.addParmas(params);
		kafkaEventMessageDto.addInboxDeepLinkParams(inboxDeepLinkParams);
		await this.notificationProducerService.InviteParticipant(kafkaEventMessageDto, eventType);
	}

	async formatDisputSerchData(disputeData: any[], userDetailModel: any) {
		const configs: Map<string, string> = await this.configurationService.getBusinessConfigurations(
			userDetailModel?.businessId
		);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATETIME_FORMAT);
		const { phonePermission, emailPermission } = await this.commonUtilityService.getPiiPermissionData(
			userDetailModel?.userId
		);
		disputeData.forEach((dispute) => {
			dispute["daysFromStatusUpdate"] = this.commonUtilityService.getDaysFromDateToToday(
				dispute[VariablesConstant.DISPUTE_UPDATED_AT]
			);
			dispute["daysFromDisputeStarted"] = this.commonUtilityService.getDaysFromDateToToday(
				dispute[VariablesConstant.DISPUTE_CREATED_AT]
			);
			dispute["disputeCreatedAt-timestamp"] = this.commonUtilityService.convertDateInToTimestamp(
				dispute[VariablesConstant.DISPUTE_CREATED_AT]
			);
			dispute[VariablesConstant.DISPUTE_CREATED_AT] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				dispute[VariablesConstant.DISPUTE_CREATED_AT],
				dateFormat
			);
			dispute[VariablesConstant.DISPUTE_UPDATED_AT] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				dispute[VariablesConstant.DISPUTE_UPDATED_AT],
				dateFormat
			);
			dispute["userMobileNumber"] = this.commonUtilityService.formatMobileNumber(
				dispute["userMobileNumber"],
				phonePermission
			);
			dispute["userEmail"] = this.commonUtilityService.formatEmail(dispute["userEmail"], emailPermission);
			dispute[VariablesConstant.RAISED_BY] = this.commonUtilityService.capitalizeWords(
				dispute[VariablesConstant.RAISED_BY]
			);
		});
	}

	async getMonthlyProofIdAndBackOfficeAccess(disputeId: number, currencyFormattingData, dateFormat, disputeHistory) {
		const monthlyProofs = await this.monthlyDocDaoService.getmonthlyProofDocByDisputeId(disputeId);
		for (const monthlyProof of monthlyProofs) {
			monthlyProof.fiRefNo = monthlyProof.fiRefNo ? JSON.parse(monthlyProof.fiRefNo) : null;
			monthlyProof.proofDetail = monthlyProof.proofDetail ? JSON.parse(monthlyProof.proofDetail) : null;

			const status = await this.docDaoService.getStatusDisplayName(monthlyProof.status);
			monthlyProof["statusDesc"] = status.description;
		}

		let backOfficeUserAccess;
		let monthlyProofId = null;
		if (monthlyProofs.length) {
			if (monthlyProofs[monthlyProofs.length - 1].status === MonthlyProofStatusEnum.REQUESTED) {
				backOfficeUserAccess = false;
				monthlyProofId = monthlyProofs[monthlyProofs.length - 1].id;
			} else {
				backOfficeUserAccess = true;
			}
		} else {
			backOfficeUserAccess = true;
		}
		const filteredMonthlyProofs = monthlyProofs.filter(
			(monthlyProof) => monthlyProof.status !== MonthlyProofStatusEnum.REQUESTED
		);
		const monthlyDisputeHistoryIdObj = {};
		filteredMonthlyProofs.forEach((proof) => {
			monthlyDisputeHistoryIdObj[proof.disputeHistoryId] = proof;
		});
		const newDisputeHistory = [];
		this.createNewDisputeHistory(
			disputeHistory,
			monthlyDisputeHistoryIdObj,
			currencyFormattingData,
			dateFormat,
			newDisputeHistory
		);

		return { backOfficeUserAccess, newDisputeHistory, monthlyProofId };
	}

	createNewDisputeHistory(
		disputeHistory,
		monthlyDisputeHistoryIdObj,
		currencyFormattingData,
		dateFormat,
		newDisputeHistory
	) {
		for (const data of disputeHistory) {
			newDisputeHistory.push(data);
			if (monthlyDisputeHistoryIdObj[data?.id]) {
				const monthlyProof = monthlyDisputeHistoryIdObj[data?.id];
				this.createDataObj(monthlyProof, currencyFormattingData, dateFormat, newDisputeHistory);
			}
		}
	}

	createDataObj(monthlyProof, currencyFormattingData, dateFormat, newDisputeHistory) {
		const dataObj = {};

		dataObj["isUser"] = false;
		dataObj["docStatus"] = monthlyProof.status;
		const docInfo = {};

		if (monthlyProof[VariablesConstant.STATUS] !== MonthlyProofStatusEnum.REJECTED) {
			this.createDocInfoForApprovedProof(docInfo, monthlyProof, currencyFormattingData, dateFormat);
		}

		docInfo["remark"] = monthlyProof.remark ? monthlyProof.remark : null;
		docInfo["rejectionReason"] = monthlyProof.proofDetail?.["rejectionReason"];
		docInfo["monthlyProofStatus"] = monthlyProof["statusDesc"];
		docInfo[VariablesConstant.PAYMENT_TYPE] = monthlyProof.proofDetail?.[VariablesConstant.PAYMENT_TYPE];

		const commentObj = { docInfo: docInfo };
		dataObj["comment"] = JSON.stringify(commentObj);
		newDisputeHistory.push(dataObj);
	}

	createDocInfoForApprovedProof(docInfo, monthlyProof, currencyFormattingData, dateFormat) {
		docInfo["amount"] = monthlyProof.amount
			? this.commonUtilityService.formatCurrency(currencyFormattingData, +monthlyProof.amount)
			: null;
		docInfo["transactionId"] = monthlyProof.fiRefNo?.[0] ? monthlyProof.fiRefNo[0] : null;
		docInfo["transactionDate"] = monthlyProof.transactionDate
			? this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(monthlyProof.transactionDate, dateFormat)
			: null;
		if (monthlyProof.proofDetail[VariablesConstant.PAYMENT_TYPE] === "Check") {
			docInfo["proofOfPayment"] = monthlyProof.proofDetail?.["proofOfPayment"];
			docInfo["amountReceiver"] = monthlyProof.proofDetail?.["amountReceiver"];
			docInfo["routingNumber"] = monthlyProof.proofDetail?.["routingNumber"];
			docInfo["accountingNumber"] = monthlyProof.proofDetail?.["accountingNumber"];
		} else if (monthlyProof.proofDetail[VariablesConstant.PAYMENT_TYPE] === "Money Order") {
			docInfo["moneyOrderSource"] = monthlyProof.proofDetail?.["moneyOrderSource"];
			docInfo["subPaymentType"] = monthlyProof.proofDetail?.["subPaymentType"];
			docInfo["bankName"] = monthlyProof.proofDetail?.["bankName"];
		}
	}

	async uploadMultipleFilesToS3(files, businessId: number) {
		const fileUrls = [];
		for (let file of files) {
			let data = await this.commonUtilityService.uploadImageToS3(file, businessId);
			fileUrls.push(data?.url);
		}
		return fileUrls;
	}

	createReceiptObj(doc) {
		const receiptObjArr = doc.map((data) => {
			const receiptObj = {};
			receiptObj["uploadedDate"] = new Date();
			receiptObj["receiptUrl"] = data;
			receiptObj[VariablesConstant.STATUS] = ReceiptStatusEnum.REQUESTED;
			return receiptObj;
		});
		return receiptObjArr;
	}

	async createMonthlyProofAndDisputeHistory(
		files,
		disputeHistory: DisputeHistoryEntity,
		dispute: DisputeEntity,
		masterProofData,
		idObj,
		queryRunner
	) {
		const { businessId, disputeId, userid } = idObj;
		const doc = await this.uploadMultipleFilesToS3(files?.fileA, businessId);
		const monthlyProof = await this.monthlyDocDaoService.getmonthlyProofDocByDisputeId(disputeId);
		if (monthlyProof.length) {
			if (monthlyProof[0].status === MonthlyProofStatusEnum.REQUESTED) {
				await this.createProofAndDisputeHistoryStatusWise(
					monthlyProof,
					disputeHistory,
					doc,
					dispute,
					queryRunner,
					userid,
					masterProofData
				);
			} else {
				throw new HttpException({ status: ResponseData.MONTHLYPROOF_ALREADY_VERIFIED }, HttpStatus.OK);
			}
		}
	}

	async createProofAndDisputeHistoryStatusWise(
		monthlyProof,
		disputeHistory,
		doc,
		dispute,
		queryRunner,
		userid,
		masterProofData
	) {
		if (monthlyProof[0].status === MonthlyProofStatusEnum.REQUESTED) {
			const receiptObjArr = this.createReceiptObj(doc);
			if (monthlyProof[0].receipt) {
				const newReceiptObjArr = JSON.parse(monthlyProof[0].receipt);
				newReceiptObjArr.push(...receiptObjArr);
				monthlyProof[0].receipt = JSON.stringify(newReceiptObjArr);
			} else {
				monthlyProof[0].receipt = JSON.stringify(receiptObjArr);
			}
			disputeHistory.docReceipt = doc[0];
			disputeHistory.addCommentDocStatus(DisputeHistoryStatusEnum.NEW);
			await this.disputeDaoService.saveDisputeHistoryFromQueryRunner(queryRunner, disputeHistory);
			monthlyProof[0].disputeHistoryId = disputeHistory.id;
			await this.monthlyDocDaoService.saveMonthlyProofDocFromQueryRunner(queryRunner, monthlyProof[0]);
		} else if (monthlyProof[0].status === MonthlyProofStatusEnum.REJECTED) {
			if (monthlyProof[0].rejectedReason === 4) {
				disputeHistory.docReceipt = doc[0];
				disputeHistory.addCommentDocStatus(DisputeHistoryStatusEnum.NEW);
				await this.disputeDaoService.saveDisputeHistoryFromQueryRunner(queryRunner, disputeHistory);
				const newMonthlyProof = new ValidationDocMonthlyProof(
					userid,
					dispute.masterProofId,
					masterProofData.monthlyProofType,
					0,
					null,
					MonthlyProofStatusEnum.REQUESTED
				);
				const receiptObjArr = this.createReceiptObj(doc);
				if (monthlyProof[0].receipt) {
					const newReceiptObjArr = JSON.parse(monthlyProof[0].receipt);
					newReceiptObjArr.push(...receiptObjArr);
					newMonthlyProof.receipt = JSON.stringify(newReceiptObjArr);
				} else {
					newMonthlyProof.receipt = JSON.stringify(receiptObjArr);
				}
				newMonthlyProof.disputeHistoryId = disputeHistory.id;
				newMonthlyProof.updateRefdocDueDates(dispute.reportingMonth, dispute.reportingYear);
				newMonthlyProof.proofPath = monthlyProof[0].proofPath;
				newMonthlyProof.addDisputeId(dispute.disputeId);
				await this.monthlyDocDaoService.saveMonthlyProofDocFromQueryRunner(queryRunner, newMonthlyProof);
			} else {
				disputeHistory.addDocUrl(doc[0]);
				disputeHistory.addCommentDocStatus(DisputeHistoryStatusEnum.NEW);
				await this.disputeDaoService.saveDisputeHistoryFromQueryRunner(queryRunner, disputeHistory);
				const newMonthlyProof = new ValidationDocMonthlyProof(
					userid,
					dispute.masterProofId,
					masterProofData.monthlyProofType,
					0,
					null,
					MonthlyProofStatusEnum.REQUESTED
				);
				newMonthlyProof.disputeHistoryId = disputeHistory.id;
				newMonthlyProof.receipt = monthlyProof[0].receipt;
				newMonthlyProof.updateRefdocDueDates(dispute.reportingMonth, dispute.reportingYear);
				newMonthlyProof.updateProofUrl(JSON.stringify(doc));
				newMonthlyProof.addDisputeId(dispute.disputeId);
				await this.monthlyDocDaoService.saveMonthlyProofDocFromQueryRunner(queryRunner, newMonthlyProof);
			}
		}
	}
}
