import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { GetDisputeDto } from "./dto/get-disputes.dto";
import { DisputeDaoService } from "@modules/dao/dispute-dao/dispute-dao.service";
import VariablesConstant from "@utils/variables-constant";
import { ConfigCodeEnum } from "@utils/enums/constants";
import { ConfigurationService } from "@utils/configuration/configuration.service";
import { CommonUtilityService } from "@utils/common/common-utility/common-utility.service";
import { GetDistputeHistoryDto } from "./dto/get-dispute-history.dto";
import { RaiseDisputeDto } from "./dto/raise-dispute.dto";
import { DisputeHelperService } from "./dispute-helper/dispute-helper.service";
import { ResponseData } from "@utils/enums/response";
import { AddDisputeCommentDto } from "./dto/add-dispute-comment.dto";
import { DisputeHistoryEntity, DisputeHistoryStatusEnum } from "./entities/dispute-history.entity";
import { DisputeEntity, DisputeStatusEnum } from "./entities/dispute.entity";
import { ResolveDisputeDto } from "./dto/resolve-dispute.dto";
import { MonthlyProofStatusEnum, PaymentTypeCodeEnum, Status } from "@utils/enums/Status";
import { MonthMapEnum } from "@utils/constants/map-month-constants";
import { DocDaoService } from "@modules/dao/doc-dao/doc-dao.service";
import { ProofStatus } from "@modules/doc/entities/validation-doc-master-proof.entity";
import { ValidationDocMonthlyProof } from "@modules/monthly-proof/entities/validation-doc-monthly-proof.entity";
import { MonthlyDocDaoService } from "@modules/dao/monthly-doc-dao/monthly-doc-dao.service";
import { DataSource } from "typeorm";
import { KafkaEventTypeEnum } from "@kafka/dto/kafka-event-message.dto";
import { AliasDaoService } from "@modules/dao/alias-dao/alias-dao.service";
import { ScreenNames } from "@utils/enums/communication-enums";
import { ChangeDisputeStatusDto } from "./dto/change-dispute-status.dto";
@Injectable()
export class DisputeService {
	constructor(
		private readonly disputeDaoService: DisputeDaoService,
		private readonly configurationService: ConfigurationService,
		private readonly commonUtilityService: CommonUtilityService,
		private readonly disputeHelperService: DisputeHelperService,
		private readonly docDaoService: DocDaoService,
		private readonly monthlyDocDaoService: MonthlyDocDaoService,
		private readonly dataSource: DataSource,
		private readonly aliasDaoService: AliasDaoService
	) {}

	async getDisputeTypes() {
		return await this.disputeDaoService.getActiveDisputeTypes();
	}

	async getDisputes(getDisputeDto: GetDisputeDto, request: any) {
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const { disputeData, total } = await this.disputeDaoService.getDisputesFilteredData(getDisputeDto);
		await this.disputeHelperService.formatDisputSerchData(disputeData, userDetailModel);
		return { disputeData, total };
	}

	async getDisputeHistoryBackoffice(getDisputeHistoryDto: GetDistputeHistoryDto, request: Request) {
		const { disputeId } = getDisputeHistoryDto;
		if (!disputeId) {
			throw new HttpException({ status: ResponseData.INVALID_DISPUTE_ID }, HttpStatus.OK);
		}
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const userInfo = await this.disputeDaoService.getUserInfoByDisputeId(disputeId);
		const configs = await this.configurationService.getChannelConfigurations(userInfo.channelId);
		const dateTimeFormat = configs.get(ConfigCodeEnum.DEFAULT_DATETIME_FORMAT) || "MM/DD/YYYY HH:mm:ss";
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT) || "MM/DD/YYYY";
		const currencyFormattingData = await this.commonUtilityService.getDataforCurrencyFormatting(configs);
		const piiPermissionData = await this.commonUtilityService.getPiiPermissionData(userDetailModel.userId);
		const disputeData = await this.disputeHelperService.getDisputeDataByDisputeId(
			disputeId,
			dateTimeFormat,
			piiPermissionData
		);
		let disputeHistory = await this.disputeHelperService.getDisputeHistoryDataByDisputeId(
			disputeId,
			dateTimeFormat,
			disputeData.raisedById
		);

		const { backOfficeUserAccess, newDisputeHistory, monthlyProofId } =
			await this.disputeHelperService.getMonthlyProofIdAndBackOfficeAccess(
				disputeId,
				currencyFormattingData,
				dateFormat,
				disputeHistory
			);
		disputeHistory = newDisputeHistory;

		return { disputeData, disputeHistory, backOfficeUserAccess, monthlyProofId };
	}

	async getDisputeHistoryApp(getDisputeHistoryDto: GetDistputeHistoryDto, request: any) {
		const { disputeId } = getDisputeHistoryDto;
		if (!disputeId) {
			throw new HttpException({ status: ResponseData.INVALID_DISPUTE_ID }, HttpStatus.OK);
		}
		const { userid, channelId } = request.headers;
		const configs = await this.configurationService.getChannelConfigurations(channelId);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT) || "MM-DD-YYYY";
		const dateTimeFormat = configs.get(ConfigCodeEnum.DEFAULT_DATETIME_FORMAT) || "MM-DD-YYYY";
		const disputeData = await this.disputeHelperService.getDisputeDataByDisputeIdAndUserId(
			disputeId,
			userid,
			dateFormat,
			dateTimeFormat
		);
		let disputeHistory = await this.disputeHelperService.getDisputeHistoryDataByDisputeId(
			disputeId,
			dateTimeFormat,
			userid
		);

		disputeHistory.forEach((history) => {
			history["comment"] = JSON.parse(history?.comment);
		});

		await this.disputeHelperService.addMonthlyProofDataInDisputeHistory(disputeHistory, disputeId);
		return { disputeData, disputeHistory };
	}

	async validateDisputeRequest(raiseDisputeDto: RaiseDisputeDto, userid: number, monthName: string) {
		const { masterProofId, disputeReasonId, year } = raiseDisputeDto;
		await this.disputeDaoService.getActiveDisputeTypeById(disputeReasonId);
		await this.docDaoService.getMasterProofsByPayeeIdMasterProofIdAndStatus(masterProofId, userid, ProofStatus.APPROVED);
		const activeDispute = await this.disputeDaoService.getActiveDisputesByMasterProofIdAndRaisedBy(
			masterProofId,
			userid
		);
		if (activeDispute) {
			throw new HttpException({ status: ResponseData.DISPUTE_ALREADY_RAISED }, HttpStatus.OK);
		}
		const requestedMonthlyProof = await this.monthlyDocDaoService.getmonthlyProofDocByMasterProofMonthAndYear(
			masterProofId,
			monthName,
			year,
			[MonthlyProofStatusEnum.REQUESTED]
		);
		if (requestedMonthlyProof) {
			throw new HttpException({ status: ResponseData.MONTHLY_PROOF_REQUESTED }, HttpStatus.OK);
		}
	}

	async raiseDispute(files: Record<string, Express.Multer.File[]>, raiseDisputeDto: RaiseDisputeDto, request: any) {
		const { userid, businessId, aliasName } = request.headers;
		const userInfo = request[VariablesConstant.USER_DETAIL_MODEL];
		const { masterProofId, disputeReasonId, discription, month, year } = raiseDisputeDto;
		const masterProofData = await this.docDaoService.getMasterProofDataAndPaymentDocMapping(masterProofId);
		const monthName = MonthMapEnum[month];
		if (!masterProofId || !disputeReasonId || !monthName || !year) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		await this.validateDisputeRequest(raiseDisputeDto, userid, monthName);
		const disputeEntity = new DisputeEntity(
			masterProofId,
			disputeReasonId,
			DisputeStatusEnum.CRYR_ACTION_PENDING,
			userid
		);
		disputeEntity.addDisputeMonthAndYear(monthName, year);
		let docUrl, docReceiptUrl;
		if (files?.fileA?.length) {
			const doc = await this.disputeHelperService.uploadMultipleFilesToS3(files?.fileA, businessId);
			docUrl = doc[0];
			if (files?.fileB?.length) {
				const docReceipt = await this.disputeHelperService.uploadMultipleFilesToS3(files?.fileB, businessId);
				docReceiptUrl = docReceipt[0];
			}
		}

		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			const dispute = await this.disputeDaoService.createDisputeByQueryRunner(queryRunner, disputeEntity);
			const disputeHistoryEntity = new DisputeHistoryEntity(dispute.disputeId, discription, userid);
			if (docUrl) {
				const newMonthlyProof = new ValidationDocMonthlyProof(
					userid,
					masterProofId,
					masterProofData.monthlyProofType,
					0,
					null,
					MonthlyProofStatusEnum.REQUESTED
				);
				disputeHistoryEntity.addDocUrl(docUrl);

				if (docReceiptUrl) {
					const receiptObjArr = this.disputeHelperService.createReceiptObj([docReceiptUrl]);
					newMonthlyProof.receipt = JSON.stringify(receiptObjArr);
					disputeHistoryEntity.docReceipt = docReceiptUrl;
				}
				disputeHistoryEntity.addCommentDocStatus(DisputeHistoryStatusEnum.NEW);
				await this.disputeDaoService.saveDisputeHistoryFromQueryRunner(queryRunner, disputeHistoryEntity);

				newMonthlyProof.disputeHistoryId = disputeHistoryEntity.id;
				newMonthlyProof.updateRefdocDueDates(monthName, year);
				newMonthlyProof.updateProofUrl(JSON.stringify([docUrl]));
				newMonthlyProof.addDisputeId(dispute.disputeId);
				await this.monthlyDocDaoService.saveMonthlyProofDocFromQueryRunner(queryRunner, newMonthlyProof);
			} else {
				await this.disputeDaoService.saveDisputeHistoryFromQueryRunner(queryRunner, disputeHistoryEntity);
			}
			this.disputeHelperService.sendDisputeUserEvent(
				userInfo,
				dispute.disputeId,
				KafkaEventTypeEnum.DISPUTE_RAISED,
				aliasName,
				ScreenNames.DISPUTE_SCREEN_NAME,
				masterProofData.refdocId
			);
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	async addDisputeCommentFromApp(
		files: Record<string, Express.Multer.File[]>,
		addDisputeCommentDto: AddDisputeCommentDto,
		request
	) {
		const { comment, disputeId } = addDisputeCommentDto;
		const { userid, businessId } = request.headers;
		if (!disputeId || (!files?.fileA?.length && !comment)) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		const dispute = await this.disputeHelperService.validateDisputeIdByUser(disputeId, userid);
		const disputeHistory = new DisputeHistoryEntity(disputeId, comment, userid);
		const masterProofData = await this.docDaoService.getMasterProofDataAndPaymentDocMapping(dispute.masterProofId);
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			if (files?.fileA?.length) {
				const idObj = { businessId, disputeId, userid };
				await this.disputeHelperService.createMonthlyProofAndDisputeHistory(
					files,
					disputeHistory,
					dispute,
					masterProofData,
					idObj,
					queryRunner
				);
			} else {
				await this.disputeDaoService.saveDisputeHistoryFromQueryRunner(queryRunner, disputeHistory);
			}
			dispute.updateStatus(DisputeStatusEnum.CRYR_ACTION_PENDING);
			await this.disputeDaoService.createDisputeByQueryRunner(queryRunner, dispute);
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	async addDisputeCommentFromBackoffice(addDisputeCommentDto: AddDisputeCommentDto, request) {
		const { comment, disputeId } = addDisputeCommentDto;
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const masterProofData = await this.disputeDaoService.getMasterProofDataByDisputeId(disputeId);
		const userInfo = await this.disputeDaoService.getUserInfoByDisputeId(disputeId);
		const { aliasName } = await this.aliasDaoService.getAliasDataByUserId(userInfo.userId);
		const userId = userDetailModel.userId;
		if (!disputeId || !comment) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		const disputeHistory = new DisputeHistoryEntity(disputeId, comment, userId);
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			await this.disputeDaoService.saveDisputeHistoryFromQueryRunner(queryRunner, disputeHistory);
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	async createMonthlyProofData(resolveDisputeDto: ResolveDisputeDto, userId: number) {
		const { disputeHistoryId, monthlyProofstatus, remark, amount, transactionId, transactionDate } = resolveDisputeDto;
		const disputeData = await this.disputeDaoService.getDisputeFullDetailsFromDisputeHistoryId(disputeHistoryId);

		const monthlyProof = new ValidationDocMonthlyProof(
			+disputeData.userId,
			disputeData.masterProofId,
			disputeData.monthlyProofType,
			amount,
			null,
			monthlyProofstatus
		);
		let proofDetail = {};
		if (disputeData?.paymentType === PaymentTypeCodeEnum.CHEQUE) {
			const { proofOfPayment, amountReceiver, routingNumber, accountingNumber } = resolveDisputeDto;
			if (proofDetail) {
				proofDetail["proofOfPayment"] = proofOfPayment;
				proofDetail["checkPayee"] = amountReceiver;
				proofDetail["routingNumber"] = routingNumber;
				proofDetail["accountingNumber"] = accountingNumber;
			}
		} else if (disputeData?.paymentType === PaymentTypeCodeEnum.MO) {
			const { amountReceiver, paymentType, bankName, moneyOrderSource } = resolveDisputeDto;
			if (proofDetail) {
				proofDetail["amountReceiver"] = amountReceiver;
				proofDetail["paymentType"] = paymentType;
				proofDetail["bankName"] = bankName;
				proofDetail["moneyOrderSource"] = moneyOrderSource;
			}
		}
		monthlyProof.proofDetail = JSON.stringify(proofDetail);
		monthlyProof.updateProofUrl(JSON.stringify([disputeData.docUrl]));
		monthlyProof.updateVerifingUserData(userId);
		monthlyProof.updateRefdocDueDates(disputeData.reportingMonth, disputeData.reportingYear);
		monthlyProof.addDisputeId(disputeData.disputeId);
		if (transactionId) {
			monthlyProof.fiRefNo = JSON.stringify([transactionId]);
		}
		monthlyProof.transactionDate = transactionDate;
		monthlyProof.remark = remark;
		return monthlyProof;
	}

	async resolveDisputeBackoffice(resolveDisputeDto: ResolveDisputeDto, request) {
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const { disputeHistoryId, monthlyProofstatus, remark, amount, transactionId, veriDocType } = resolveDisputeDto;
		if (
			!disputeHistoryId ||
			!Object.values(MonthlyProofStatusEnum).includes(monthlyProofstatus) ||
			(monthlyProofstatus === MonthlyProofStatusEnum.APPROVED && (!transactionId || !amount)) ||
			!remark
		) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		const configs: Map<string, string> = await this.configurationService.getBusinessConfigurations(
			userDetailModel?.channelId
		);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT) || "MM/DD/YYYY HH:mm:ss";
		const currencyFormattingData = await this.commonUtilityService.getDataforCurrencyFormatting(configs);
		const docInfo = { ...resolveDisputeDto };
		docInfo["transactionDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			docInfo?.transactionDate,
			dateFormat
		) as any;
		delete docInfo.disputeHistoryId;
		delete docInfo.veriDocType;
		delete docInfo["token"];
		const status = await this.docDaoService.getStatusDisplayName(docInfo["monthlyProofstatus"]);
		docInfo["monthlyProofStatus"] = status.description;
		delete docInfo.monthlyProofstatus;
		docInfo["subPaymentType"] = docInfo.paymentType;
		const paymentTypeData = await this.docDaoService.getPaymentTypeNameByPaymentType(veriDocType);
		docInfo["paymentType"] = paymentTypeData.docTypeName;
		docInfo["amount"] = this.commonUtilityService.formatCurrency(currencyFormattingData, docInfo["amount"]) as any;
		if (monthlyProofstatus === MonthlyProofStatusEnum.REJECTED) {
			for (const key in docInfo) {
				if (key !== "rejectedReasonId" && key !== "remark" && key !== "veriDocType") {
					delete docInfo[key];
				}
			}
			const rejectionReason = await this.docDaoService.getRejectionReasonData(docInfo.rejectedReasonId, Status.ACTIVE);
			docInfo["rejectionReason"] = rejectionReason.reason;
		}
		delete docInfo["rejectedReasonId"];
		const disputeHistoryData = await this.disputeDaoService.getDisputeHistoryById(disputeHistoryId);
		const masterproofData = await this.disputeDaoService.getMasterProofDataByDisputeId(disputeHistoryData.disputeId);

		const isTransactionid = await this.monthlyDocDaoService.getMonthlyVerifiedProofsByTransactionIdAndPaymentType(
			transactionId,
			masterproofData.paymentType
		);
		if (isTransactionid && masterproofData.paymentType === PaymentTypeCodeEnum.CHEQUE) {
			throw new HttpException({ status: ResponseData.INVALID_CHECK_NUMBER }, HttpStatus.OK);
		} else if (isTransactionid && masterproofData.paymentType === PaymentTypeCodeEnum.MO) {
			throw new HttpException({ status: ResponseData.INVALID_MONEY_ORDER_NUMBER }, HttpStatus.OK);
		} else if (isTransactionid && masterproofData.paymentType === PaymentTypeCodeEnum.FLEX) {
			throw new HttpException({ status: ResponseData.INVALID_FLEX_AGREEMENT_NUMBER }, HttpStatus.OK);
		} else if (
			isTransactionid &&
			(masterproofData.paymentType === PaymentTypeCodeEnum.CC ||
				masterproofData.paymentType === PaymentTypeCodeEnum.DC)
		) {
			throw new HttpException({ status: ResponseData.INVALID_TRANSACTION_ID }, HttpStatus.OK);
		}

		if (veriDocType === PaymentTypeCodeEnum.CHEQUE && monthlyProofstatus === MonthlyProofStatusEnum.APPROVED) {
			delete docInfo["subPaymentType"];
			delete docInfo.bankName;
			delete docInfo.moneyOrderSource;
		} else if (veriDocType === PaymentTypeCodeEnum.MO && monthlyProofstatus === MonthlyProofStatusEnum.APPROVED) {
			delete docInfo.routingNumber;
			delete docInfo.accountingNumber;
			delete docInfo.proofOfPayment;
			if (!docInfo.bankName) {
				delete docInfo.bankName;
			}
		} else {
			delete docInfo.accountingNumber;
			delete docInfo.amountReceiver;
			delete docInfo.bankName;
			delete docInfo.moneyOrderSource;
			delete docInfo["subPaymentType"];
			delete docInfo.proofOfPayment;
			delete docInfo.routingNumber;
		}

		let monthlyProof: ValidationDocMonthlyProof;
		if (monthlyProofstatus === MonthlyProofStatusEnum.APPROVED) {
			monthlyProof = await this.createMonthlyProofData(resolveDisputeDto, +userDetailModel.userId);
			disputeHistoryData.addCommentDocStatus(DisputeHistoryStatusEnum.APPROVED);
		} else {
			disputeHistoryData.addCommentDocStatus(DisputeHistoryStatusEnum.REJECTED);
			disputeHistoryData.addDocRejectionRemark(remark);
		}

		const commentObj = JSON.parse(disputeHistoryData.comment);
		const commentWithDocInfo = { ...commentObj, docInfo: docInfo };
		disputeHistoryData.comment = JSON.stringify(commentWithDocInfo);

		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			if (monthlyProof) {
				monthlyProof = await this.monthlyDocDaoService.saveMonthlyProofDocFromQueryRunner(queryRunner, monthlyProof);
				await this.disputeHelperService.updatePaymentScheduleStatusByQueryRunner(
					queryRunner,
					monthlyProof,
					transactionId
				);
			}
			await this.disputeDaoService.saveDisputeHistoryFromQueryRunner(queryRunner, disputeHistoryData);
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	async changeDisputeStatus(changeDisputeStatusDto: ChangeDisputeStatusDto) {
		const { disputeId, disputeStatus } = changeDisputeStatusDto;
		const masterproofData = await this.disputeDaoService.getMasterProofDataByDisputeId(disputeId);
		const userInfo = await this.disputeDaoService.getUserInfoByDisputeId(disputeId);
		const { aliasName } = await this.aliasDaoService.getAliasDataByUserId(userInfo.userId);
		this.disputeDaoService.updateDisputeStatus(disputeId, disputeStatus);
		this.disputeHelperService.sendDisputeUserEvent(
			userInfo,
			disputeId,
			disputeStatus === DisputeStatusEnum.CLOSED
				? KafkaEventTypeEnum.DISPUTE_CLOSED
				: KafkaEventTypeEnum.DISPUTE_UPDATES,
			aliasName,
			ScreenNames.DISPUTE_SCREEN_NAME,
			masterproofData.refdocId
		);
	}

	async addReceiptRequestInDisputeHistory(askForReceiptDto: GetDistputeHistoryDto, request) {
		const { disputeId } = askForReceiptDto;
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const userId = +userDetailModel.userId;
		const disputeHistory = new DisputeHistoryEntity(disputeId, "Please provide receipt", userId);
		await this.disputeDaoService.insertDisputeHistory(disputeHistory);
	}
}
