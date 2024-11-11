import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { DocDaoService } from "../dao/doc-dao/doc-dao.service";
import { RefdocMasterStatusEnum } from "./entities/refdoc-master.entity";
import { ResponseData } from "src/utils/enums/response";
import { CommonUtilityService } from "src/utils/common/common-utility/common-utility.service";
import { ApproveRefDocDto } from "./dto/approve-ref-doc.dto";
import { UpdateMasterProofDto } from "./dto/update.masterProof.dto";
import { MasterProofTypeEnum, ProofStatus } from "./entities/validation-doc-master-proof.entity";
import { RefdocParticipantsMaster, isPrimary } from "./entities/refdoc-participants-master.entity";
import VariablesConstant from "src/utils/variables-constant";
import {
	DocTypeEnum,
	HaveLeaseStatus,
	LeaseParticipantType,
	MonthlyProofStatusEnum,
	PaymentTypeCodeEnum,
	RefdocOverallStatusEnum,
	RentPaymentByEnum,
	RequestStatusEnum,
	Status,
	UserProfileStatusEnum,
	YNStatusEnum,
	YesNoEnum
} from "@utils/enums/Status";
import { RefDocIdDto } from "@modules/plaid/dto/refdoc-id.dto";
import { ParticipantDaoService } from "@modules/dao/participant-dao/participant-dao.service";
import { PackageDaoService } from "@modules/dao/package-dao/package-dao.service";
import { UserDaoService } from "@modules/dao/user-dao/user-dao.service";
import { GetRefdocDto } from "./dto/getrefdoc.dto";
import { DocMasterProofDto } from "./dto/getdoc-master-proof.dto";
import { MemoryStorageFile } from "@blazity/nest-file-fastify";
import { PaymentUsersMappingRequest } from "@modules/participant/entities/payment-user-mapping-request.entity";
import { ParticipantMapRequest } from "@modules/participant/entities/participant-map-request.entity";
import { SaveMasterProofDto } from "./dto/save-master-proof.dto";
import { UpdateRefdocDto } from "./dto/update-refdoc.dto";
import { UserProfileProgress } from "@modules/user-master/entities/user-profile-progress-status.entity";
import { UserSubscriptionTransactions } from "@modules/package/entities/user-subscription-txn.entity";
import { MonthlyDocDaoService } from "@modules/dao/monthly-doc-dao/monthly-doc-dao.service";
import { ConfigCodeEnum } from "@utils/enums/constants";
import { DocHelperService } from "./doc-helper/doc-helper.service";
import { RentDetailsDto } from "./dto/rent-details.dto";
import { ConfigurationService } from "@utils/configuration/configuration.service";
import { KafkaEventTypeEnum } from "@kafka/dto/kafka-event-message.dto";
import { DisputeDaoService } from "@modules/dao/dispute-dao/dispute-dao.service";
import { SaveRentPaymentDetails } from "./dto/rent-payment-details.dto";
import { RefdocUsersEntity } from "./entities/refdoc-users.entity";
import { ScreenNames } from "@utils/enums/communication-enums";
import { PaymentScheduleStatus } from "./entities/payment-schedule.entity";
import { DocTypeRefdocEnum } from "@utils/enums/user-communication";
import { DataSource } from "typeorm";
import { UserType } from "@utils/enums/user-types";
import { GetDropDownOptionsDto } from "./dto/dropdown-options-dto";
@Injectable()
export class DocService {
	constructor(
		private readonly docHelperService: DocHelperService,
		private docDaoService: DocDaoService,
		private readonly commonUtilityService: CommonUtilityService,
		private readonly participantDaoService: ParticipantDaoService,
		private readonly packageDaoService: PackageDaoService,
		private readonly userDaoService: UserDaoService,
		private readonly monthlyDocDaoService: MonthlyDocDaoService,
		private readonly configurationService: ConfigurationService,
		private readonly disputeDaoService: DisputeDaoService,
		private readonly dataSource: DataSource
	) {}

	async docMasterProof(docMasterProofDto: DocMasterProofDto, request) {
		let { refdocId } = docMasterProofDto;
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const refdoc = await this.docDaoService.getRefdocDetailsById(refdocId);
		const { phonePermission, emailPermission } = await this.commonUtilityService.getPiiPermissionData(
			userDetailModel?.userId
		);
		refdoc["userMobileNumber"] = this.commonUtilityService.formatMobileNumber(
			refdoc["userMobileNumber"],
			phonePermission
		);
		refdoc["userEmail"] = this.commonUtilityService.formatEmail(refdoc["userEmail"], emailPermission);
		refdoc["participants"] = await this.docDaoService.getRefdocParticipantsDetails(refdocId);
		refdoc["participants"].forEach((participantData) => {
			participantData["firstName"] = this.commonUtilityService.capitalizeWords(participantData["firstName"]);
			participantData["lastName"] = this.commonUtilityService.capitalizeWords(participantData["lastName"]);
		});
		refdoc["masterProofs"] = await this.docDaoService.getMasterProofFilteredData(refdocId);
		refdoc["paymentSchedule"] = await this.docDaoService.getPaymentSchedule([refdocId]);
		const configs = await this.configurationService.getChannelConfigurations(refdoc.channelId);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT);
		const dateTimeFormat = configs.get(ConfigCodeEnum.DEFAULT_DATETIME_FORMAT);
		const currencyFormattingData = await this.commonUtilityService.getDataforCurrencyFormatting(configs);
		refdoc["formattedBaseAmount"] = this.commonUtilityService.formatCurrency(
			currencyFormattingData,
			refdoc["rentAmount"]
		);
		refdoc["validFrom"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			refdoc["validFrom"],
			dateFormat
		);
		refdoc["validTo"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(refdoc["validTo"], dateFormat);
		refdoc["verifiedAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			refdoc["verifiedAt"],
			dateTimeFormat
		);
		refdoc["uploadedDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			refdoc["uploadedDate"],
			dateTimeFormat
		);
		refdoc["firstName"] = this.commonUtilityService.capitalizeWords(refdoc["firstName"]);
		refdoc["lastName"] = this.commonUtilityService.capitalizeWords(refdoc["lastName"]);
		refdoc["middleName"] = this.commonUtilityService.capitalizeWords(refdoc["middleName"]);
		refdoc["suffixName"] = this.commonUtilityService.capitalizeWords(refdoc["suffixName"]);
		refdoc["ownerName"] = this.commonUtilityService.capitalizeWords(refdoc["ownerName"]);
		refdoc["userFirstName"] = this.commonUtilityService.capitalizeWords(refdoc["userFirstName"]);
		refdoc["userLastName"] = this.commonUtilityService.capitalizeWords(refdoc["userLastName"]);
		refdoc["userSuffixName"] = this.commonUtilityService.capitalizeWords(refdoc["userSuffixName"]);
		refdoc["userMiddleName"] = this.commonUtilityService.capitalizeWords(refdoc["userMiddleName"]);
		refdoc["masterProofs"].forEach((masterProof) => {
			masterProof.masterProofValidTill = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				masterProof.masterProofValidTill,
				dateFormat
			);
			masterProof.verifiedAt = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				masterProof.verifiedAt,
				dateTimeFormat
			);
			masterProof.createdAt = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				masterProof.createdAt,
				dateTimeFormat
			);
			masterProof.payeeFirstName = this.commonUtilityService.capitalizeWords(masterProof.payeeFirstName);
			masterProof.payeeLastName = this.commonUtilityService.capitalizeWords(masterProof.payeeLastName);
			masterProof.userFirstName = this.commonUtilityService.capitalizeWords(masterProof.userFirstName);
			masterProof.payeeLastName = this.commonUtilityService.capitalizeWords(masterProof.payeeLastName);
			masterProof.proofDetail = JSON.parse(masterProof.proofDetail);
			if (masterProof?.proofDetail) {
				masterProof.proofDetail.validFrom = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
					masterProof.proofDetail?.validFrom,
					dateFormat
				);
				masterProof.proofDetail.formattedBaseAmount = this.commonUtilityService.formatCurrency(
					currencyFormattingData,
					masterProof.proofDetail?.amount
				);
			}
		});
		refdoc["paymentSchedule"]?.forEach((schedule) => {
			schedule["dueDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				schedule["dueDate"],
				dateFormat
			);
			schedule["paymentDueDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				schedule["paymentDueDate"],
				dateFormat
			);
		});
		return refdoc;
	}

	async uploadRefdoc(file, body, request) {
		if (
			!body.refdocTypeId ||
			!body.haveLease ||
			!body.paymentId ||
			!Object.keys(HaveLeaseStatus).includes(body.haveLease)
		) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		if (body.haveLease === YesNoEnum.YES && !file?.buffer?.buffer?.byteLength) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		let { businessId, userid, aliasName } = request.headers;
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		let { paymentId } = body;
		const refdocTypeData = await this.docDaoService.getRefDocTypeById(body.refdocTypeId);
		const paymentDetails = await this.packageDaoService.getUserSubscriptionDataByPaymentId(userid, paymentId);
		const refdoc = await this.docDaoService.getRefdocMasterByUserIdRefdocIdAndStatus(
			paymentDetails.refdocId,
			userid,
			RefdocMasterStatusEnum.REFDOC_UPLOAD_PENDING
		);
		let url = null;
		let refdocStatus = RefdocMasterStatusEnum.TENANT_DETAILS_PENDING;
		if (body.haveLease === HaveLeaseStatus.YES) {
			let data = await this.commonUtilityService.uploadImageToS3(file, businessId);
			url = data?.url;
		}
		refdoc.verifiedBy = userid;
		refdoc.updateDocumentPath(url);
		refdoc.updateRefdocStatus(refdocStatus);
		refdoc.updateUploadAndApproveDetails(new Date());
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			await this.docDaoService.saveRefdocMasterByQueryRunner(refdoc, queryRunner);
			await this.docHelperService.saveRefdocHistoryDataByQueryRunner(refdoc, queryRunner);
			userDetailModel["refDocParticipant"] = YNStatusEnum.YES;
			await this.userDaoService.saveUserInfoByQueryRunner(userDetailModel, queryRunner);

			let data = {
				refdocId: refdoc.refdocId,
				leaseUrl: url
			};
			const userProfileStatus = await this.userDaoService.getUserProfileDataForRefdoc(userid, null);
			if (userProfileStatus) {
				await this.commonUtilityService.updateUserProfileStatus(
					userid,
					UserProfileStatusEnum.REFDOC_PENDING,
					UserProfileStatusEnum.LEASE_DATA_PENDING,
					JSON.stringify(data),
					null,
					queryRunner,
					userProfileStatus
				);
			} else {
				await this.commonUtilityService.updateUserProfileStatus(
					userid,
					UserProfileStatusEnum.REFDOC_PENDING,
					UserProfileStatusEnum.LEASE_DATA_PENDING,
					JSON.stringify(data),
					refdoc.refdocId,
					queryRunner
				);
			}
			await queryRunner.commitTransaction();
			if (body.haveLease === HaveLeaseStatus.YES) {
				this.docHelperService.sendUserEvent(
					userDetailModel,
					DocTypeRefdocEnum.LEASE,
					KafkaEventTypeEnum.UPLOAD_SUCCESSFUL,
					aliasName,
					ScreenNames.LEASE_SCREEN_NAME,
					refdocTypeData.name,
					refdoc.refdocId
				);
			}
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
		return { url, refdocId: refdoc.refdocId };
	}

	/**
	 *
	 * @param approveRefDocDto
	 * @param request
	 * @returns
	 * @author Ankit Singh
	 */
	async updateRefDocStatus(approveRefDocDto: ApproveRefDocDto, request: any) {
		let { refdocId, status, docType, remark, rejectedReasonId } = approveRefDocDto;
		const userDetailModel = request[VariablesConstant?.USER_DETAIL_MODEL];
		let userId = userDetailModel?.userId;
		if (status === RefdocMasterStatusEnum.REJECTED && (!remark || !rejectedReasonId)) {
			throw new HttpException({ data: {}, status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		if (docType === DocTypeEnum.REFDOC) {
			if (!refdocId || !Object.keys(RefdocMasterStatusEnum).includes(status)) {
				throw new HttpException({ data: {}, status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
			}
			return await this.docHelperService.verifyRefdocFromBackoffice(approveRefDocDto, userId);
		} else {
			return await this.docHelperService.verifyMasterProofFromBackoffice(approveRefDocDto, userId);
		}
	}

	async docMasterProofUpdateStatus(updateMasterProofDto: UpdateMasterProofDto, request: any) {
		const userDetailModel = request[VariablesConstant?.USER_DETAIL_MODEL];
		const verifierId = userDetailModel?.userId || 11;
		const { refdocId, masterProofId, status, rejectedReasonId, remark, flexStartDate, flexEndDate } =
			updateMasterProofDto;
		if (!refdocId || !masterProofId || !Object.values(ProofStatus).includes(status)) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		const masterProof = await this.docDaoService.getMasterProofById(masterProofId, refdocId);
		masterProof.updateStatus(status);
		masterProof.updateVerifingDetails(verifierId);
		if (status === ProofStatus.REJECTED) {
			if (!rejectedReasonId) {
				throw new HttpException({ status: ResponseData.INVALID_REJECTION_REASON_ID }, HttpStatus.OK);
			}
			await this.docDaoService.getRejectionReasonData(rejectedReasonId, Status.ACTIVE);
			masterProof.updateRemarkRejectionReason(remark, rejectedReasonId);
		} else if (status === ProofStatus.APPROVED) {
			if (masterProof.paymentType === PaymentTypeCodeEnum.FLEX) {
				const proofDetail = {};
				proofDetail["flexStartDate"] = flexStartDate;
				proofDetail["flexEndDate"] = flexEndDate;
				masterProof.proofDetail = JSON.stringify(proofDetail);
			}
			if (remark) {
				masterProof.remark = remark;
			}
		}
		await this.docDaoService.saveValidationDocMasterData(masterProof);
	}

	async getRefdocMaster(body: GetRefdocDto, request: any) {
		let { docType, page, limit } = body;
		let refDocData, total;
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const configs = await this.configurationService.getBusinessConfigurations(userDetailModel?.businessId);
		const dateTimeFormat = configs.get(ConfigCodeEnum.DEFAULT_DATETIME_FORMAT);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT);
		const { phonePermission, emailPermission, ssnPermission } = await this.commonUtilityService.getPiiPermissionData(
			userDetailModel?.userId
		);
		if (docType === DocTypeEnum.REFDOC) {
			const { refDocsData, totalRefdocs } = await this.getRefdocMasterForRefdoc(
				phonePermission,
				dateTimeFormat,
				dateFormat,
				body,
				emailPermission,
				ssnPermission
			);
			refDocData = refDocsData;
			total = totalRefdocs;
		} else if (docType === DocTypeEnum.MASTER) {
			let refDocFilteredData = await this.docDaoService.getMasterProofDataBackoffice(body, page, limit);
			refDocData = refDocFilteredData.refDocData;
			const refdocIdToData: Map<string, string> = refDocFilteredData.refdocIdToData;
			refDocData?.forEach((refdoc) => {
				refdoc["userMobileNumber"] = this.commonUtilityService.formatMobileNumber(
					refdoc["userMobileNumber"],
					phonePermission
				);
				refdoc["userEmail"] = this.commonUtilityService.formatEmail(refdoc["userEmail"], emailPermission);
				refdoc["validFrom"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
					refdoc["validFrom"],
					dateFormat
				);
				refdoc["validTo-timestamp"] = this.commonUtilityService.convertDateInToTimestamp(refdoc["validTo"]);
				refdoc["validTo"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
					refdoc["validTo"],
					dateFormat
				);
				refdoc["userFirstName"] = this.commonUtilityService.capitalizeWords(refdoc["userFirstName"]);
				refdoc["userLastName"] = this.commonUtilityService.capitalizeWords(refdoc["userLastName"]);
				refdoc["validationDocCount"] = refdocIdToData.get(refdoc.refdocId);
			});
			total = refDocFilteredData.total;
		}
		return { refDocData, total };
	}

	async getRefdocMasterForRefdoc(phonePermission, dateTimeFormat, dateFormat, body, emailPermission, ssnPermission) {
		const { page, limit, userType, status, pendingManualPaymentsVerification } = body;
		const userIds = [];
		const refdocIds = [];
		if (userType) {
			const userIdsWithRefdocCount = await this.docDaoService.getUserIdsWithRefdocCount(userType);
			userIdsWithRefdocCount.forEach((userIdWithRefdocCount) => {
				userIds.push(userIdWithRefdocCount.userId);
			});
		}
		if (pendingManualPaymentsVerification) {
			const refdocIdsObjArr = await this.docDaoService.getRefdocIdsForRequestedMonthlyProofs();
			refdocIdsObjArr.forEach((refdocIdObj) => {
				refdocIds.push(refdocIdObj.refdocId);
			});
		}
		let refDocFilteredData = await this.docDaoService.getRefdocMasterFilteredData(body, page, limit, userIds, refdocIds);
		const totalRefdocs = refDocFilteredData.total;
		const refDocsData = refDocFilteredData?.refDocData.map((refdoc) => {
			let refdocStatus = status?.split(",");
			if (refdoc["interimData"]) {
				const interimData = JSON.parse(refdoc["interimData"]);
				if (
					interimData["validTo"] &&
					(refdocStatus.includes(RefdocMasterStatusEnum.PROPOSED_TO_APPROVE) ||
						refdocStatus.includes(RefdocMasterStatusEnum.PROPOSED_TO_REJECT))
				) {
					if (!refdoc["validTo"]) {
						refdoc["validTo"] = interimData["validTo"];
					}
				}
			}
			refdoc["userMobileNumber"] = this.commonUtilityService.formatMobileNumber(
				refdoc["userMobileNumber"],
				phonePermission
			);
			refdoc["userEmail"] = this.commonUtilityService.formatEmail(refdoc["userEmail"], emailPermission);
			refdoc["validTo-timestamp"] = this.commonUtilityService.convertDateInToTimestamp(refdoc["validTo"]);
			refdoc["validTo"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				refdoc["validTo"],
				dateFormat
			);
			refdoc["uploadedDate-timestamp"] = this.commonUtilityService.convertDateInToTimestamp(refdoc["uploadedDate"]);
			refdoc["uploadedDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				refdoc["uploadedDate"],
				dateTimeFormat
			);
			refdoc["userFirstName"] = this.commonUtilityService.capitalizeWords(refdoc["userFirstName"]);
			refdoc["userLastName"] = this.commonUtilityService.capitalizeWords(refdoc["userLastName"]);
			refdoc["ssnId"] = this.commonUtilityService.formatSsn(refdoc["ssnId"], ssnPermission);
			return refdoc;
		});
		return { refDocsData, totalRefdocs };
	}

	async getRefdocDetails(refdocIdDto: RefDocIdDto, request: any) {
		const { refdocId } = refdocIdDto;
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		let refdocData = await this.docDaoService.getRefdocDetailsById(refdocId);
		const configs = await this.configurationService.getChannelConfigurations(refdocData.channelId);
		const currencyFormattingData = await this.commonUtilityService.getDataforCurrencyFormatting(configs);
		const piiPermissions = await this.commonUtilityService.getPiiPermissionData(userDetailModel?.userId);
		const refdocProposedStatus = [
			RefdocMasterStatusEnum.PROPOSED_TO_APPROVE,
			RefdocMasterStatusEnum.PROPOSED_TO_REJECT,
			RefdocMasterStatusEnum.INTERMEDIATE_REJECTION
		];
		if (refdocProposedStatus.includes(refdocData.status)) {
			return await this.docHelperService.getRefdocDataFromInterimData(refdocData, currencyFormattingData);
		}
		refdocData = await this.docHelperService.getParticipantDataForRefdoc(refdocData, piiPermissions);
		refdocData["extraDetails"] = await this.docDaoService.getRefdocExtraDetailsById(refdocId);
		refdocData["paymentSchedule"] = await this.docHelperService.getPaymentScheduleWithAmountAppoved(
			refdocId,
			currencyFormattingData
		);
		refdocData["masterProofs"] = await this.docDaoService.getMasterProofDataForRefdoc(refdocId);
		refdocData["disputeData"] = await this.disputeDaoService.getDisputeDataByRefdocId(refdocId);
		await this.docHelperService.updateDateFormatForRefdocFullData(
			configs,
			refdocData,
			currencyFormattingData,
			piiPermissions
		);
		return refdocData;
	}

	async getRefDocTypes(request: any) {
		let refDocTypes = await this.docDaoService.getRefDocTypes();
		return refDocTypes;
	}

	getLastDateOfMonth() {
		let currDate = new Date();
		let last = new Date(currDate.getFullYear(), currDate.getMonth() + 1, 0);
		return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(
			2,
			"0"
		)}`;
	}

	async leaseData(leaseDataDto: RentDetailsDto, request: any) {
		let { refdocId, leaseParticipants, userType } = leaseDataDto;
		let { userid, channelId } = request.headers;
		const configs = await this.configurationService.getChannelConfigurations(channelId);
		const mobileCode = configs.get(ConfigCodeEnum.COUNTRY_CODE) || "+91";
		let primaryUserInfo = await this.userDaoService.getUserInfoByUserId(userid);
		await this.docHelperService.checkRefdocValidity(leaseDataDto, request);
		let requestedUserProfileData: UserProfileProgress;
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			if (leaseParticipants.type === LeaseParticipantType.PAYMENT_REQUEST) {
				let paymentRequestResponse = await this.docHelperService.handlePaymentRequest(
					leaseParticipants,
					primaryUserInfo,
					userid,
					refdocId,
					requestedUserProfileData,
					mobileCode,
					userType
				);
				const paymentRequestData: PaymentUsersMappingRequest = paymentRequestResponse.paymentRequestData;
				requestedUserProfileData = paymentRequestResponse.requestedUserProfileData;
				await this.participantDaoService.createPaymentUserMappingRequestByQueryRunner(
					paymentRequestData,
					queryRunner
				);
			} else if (leaseParticipants?.type === LeaseParticipantType.PARTICIPANT) {
				let participantRequestResponse = await this.docHelperService.handleParticipant(
					leaseParticipants,
					primaryUserInfo,
					userid,
					refdocId,
					requestedUserProfileData,
					mobileCode
				);
				requestedUserProfileData = participantRequestResponse.requestedUserProfileData;
				const participantRequestData: ParticipantMapRequest = participantRequestResponse.participantMappingRequest;
				await this.participantDaoService.createParticipantMapRequestByQueryRunner(
					participantRequestData,
					queryRunner
				);
			}
			if (requestedUserProfileData)
				await this.userDaoService.addUserProfileDataByQueryRunner(requestedUserProfileData, queryRunner);
			await this.docHelperService.updateUserProfileStatusByUserType(leaseDataDto, userid, queryRunner);
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	async saveRentPaymentDetails(saveRentPaymentDetails: SaveRentPaymentDetails, request: any) {
		const { refdocId, self, paymentRequest, isPrimaryUser, participant } = saveRentPaymentDetails;
		const userInfo = request[VariablesConstant.USER_DETAIL_MODEL];
		const userId = userInfo.userId;
		await this.docHelperService.validateRentPaymentRequest(saveRentPaymentDetails, userId);
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			let primaryUserPackage: UserSubscriptionTransactions;
			if (isPrimaryUser === YesNoEnum.YES) {
				let renewalMonth = this.commonUtilityService.getPackageRenewalDate(1);
				primaryUserPackage = await this.packageDaoService.getUserSubByRefDocAndRenewalMonth(
					userId,
					refdocId,
					renewalMonth
				);
			} else {
				userInfo["refDocParticipant"] = YNStatusEnum.YES;
				await this.userDaoService.saveUserInfoByQueryRunner(userInfo, queryRunner);
				const refdocUser: RefdocUsersEntity = new RefdocUsersEntity(refdocId, userId, null, null, Status.ACTIVE);
				await this.docDaoService.saveRefdocUsersDataByQueryRunner(refdocUser, queryRunner);
				await this.docHelperService.saveUserPaymentScheduleForParticpant(userId, refdocId, queryRunner);
			}
			let refdocParticipantData = await this.docDaoService.getRefdocParticipantDataByUserRefdocIdAndStatus(
				refdocId,
				userId,
				Status.ACTIVE
			);
			if (refdocParticipantData) {
				throw new HttpException({ status: ResponseData.DATA_ALREADY_EXIST }, HttpStatus.OK);
			}
			const paymentBy: RentPaymentByEnum = this.docHelperService.getPaymentBy(
				self === YesNoEnum.YES,
				paymentRequest === YesNoEnum.YES
			);
			refdocParticipantData = new RefdocParticipantsMaster(
				userId,
				isPrimaryUser === YesNoEnum.YES ? isPrimary.Y : isPrimary.N,
				refdocId,
				isPrimaryUser === YesNoEnum.YES ? isPrimary.Y : isPrimary.N,
				paymentBy,
				primaryUserPackage ? primaryUserPackage.packageId : null,
				Status.ACTIVE
			);
			await this.docDaoService.saveRefdocParticipantDataByQueryRunner(refdocParticipantData, queryRunner);
			await this.docHelperService.updateUserProfileStatusForRentDetails(saveRentPaymentDetails, userId, queryRunner);
			if (isPrimaryUser === YesNoEnum.YES && paymentRequest === YesNoEnum.NO && participant === YesNoEnum.NO) {
				await this.docHelperService.updateRefdocStatusForComplete(refdocId, userId, queryRunner);
			}
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	async saveValidationDocMasterProof(file: MemoryStorageFile, saveMasterProofDto: SaveMasterProofDto, request: any) {
		const { aliasName } = request.headers;
		const userId = request.headers.userid;
		const userInfo = request[VariablesConstant.USER_DETAIL_MODEL];
		await this.docHelperService.checkValidationDocMasterProofDto(saveMasterProofDto, file);
		let { isOtherPayee, masterProofType, paymentType, refdocId } = saveMasterProofDto;
		const { docTypeName } = await this.docDaoService.getPaymentTypeNameByPaymentType(paymentType);
		const { refdocType } = await this.docDaoService.getRefdocTypeByRefdocId(refdocId);
		let benificiaryUserId = userId;
		if (isOtherPayee === YesNoEnum.YES) {
			benificiaryUserId = await this.docHelperService.validatePayeeRequest(saveMasterProofDto, request);
		}
		await this.docDaoService.getRefdocParticipantDataByUser(refdocId, benificiaryUserId, Status.ACTIVE);
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			if (masterProofType == MasterProofTypeEnum.PLAID) {
				await this.docHelperService.savePlaidValidationDocAsMasterProof(
					saveMasterProofDto,
					request,
					benificiaryUserId,
					queryRunner
				);
			} else if (masterProofType === MasterProofTypeEnum.AGREEMENT) {
				await this.docHelperService.saveMasterProofAgreementData(
					saveMasterProofDto,
					request,
					benificiaryUserId,
					file,
					queryRunner
				);
			} else if (masterProofType === MasterProofTypeEnum.MONTHLY_REQUIRED) {
				await this.docHelperService.saveMonthlyRequiredMasterProofData(
					saveMasterProofDto,
					request,
					benificiaryUserId,
					queryRunner
				);
			} else if (masterProofType === MasterProofTypeEnum.DESCRIPTION) {
				await this.docHelperService.saveDescriptionMasterProofData(
					saveMasterProofDto,
					request,
					benificiaryUserId,
					file,
					queryRunner
				);
			}
			userInfo["veriDocParticipant"] = YNStatusEnum.YES;
			await this.userDaoService.saveUserInfoByQueryRunner(userInfo, queryRunner);
			await this.docHelperService.handleRefdocUserEntry(
				isOtherPayee,
				refdocId,
				benificiaryUserId,
				userId,
				queryRunner
			);
			await this.docHelperService.updateUserRefdocProfileStatusAfterMasterProof(
				isOtherPayee,
				userId,
				refdocId,
				queryRunner
			);
			this.docHelperService.sendUserEvent(
				userInfo,
				refdocType,
				KafkaEventTypeEnum.UPLOAD_SUCCESSFUL,
				aliasName,
				docTypeName,
				ScreenNames.MASTER_PROOF_SCREEN_NAME,
				refdocId
			);
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	async updateRefdoc(file: MemoryStorageFile, updateRefdocDto: UpdateRefdocDto, request: any) {
		const { refdocId } = updateRefdocDto;
		if (!refdocId || !file?.buffer?.buffer?.byteLength) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		const { businessid, userid, aliasName } = request.headers;
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		let refdocData = await this.docDaoService.getUserRefdocMasterDataByRefdoc(userid, refdocId);
		if (
			(!refdocData?.documentPath &&
				!(
					refdocData.status === RefdocMasterStatusEnum.LEASE_PENDING ||
					refdocData.status === RefdocMasterStatusEnum.TENANT_DETAILS_PENDING
				)) ||
			(refdocData?.documentPath && refdocData.status !== RefdocMasterStatusEnum.REJECTED)
		) {
			throw new HttpException({ status: ResponseData.REFDOC_UPDATE_NOT_ALLOWED }, HttpStatus.OK);
		}
		let data = await this.commonUtilityService.uploadImageToS3(file, businessid);
		let url = data.url;
		refdocData.status = RefdocMasterStatusEnum.REQUESTED;
		refdocData.documentPath = url;
		refdocData.updateUploadAndApproveDetails(new Date());
		refdocData.verifiedBy = userid;
		refdocData.rejectedReason = null;
		refdocData.remark = null;
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			await this.docDaoService.updateRefdocDetails(refdocData, queryRunner);
			await this.docHelperService.saveRefdocHistoryDataByQueryRunner(refdocData, queryRunner);
			const refdocTypeData = await this.docDaoService.getRefDocTypeById(refdocData.refdocTypeId);
			this.docHelperService.sendUserEvent(
				userDetailModel,
				DocTypeRefdocEnum.LEASE,
				KafkaEventTypeEnum.UPLOAD_SUCCESSFUL,
				aliasName,
				ScreenNames.LEASE_SCREEN_NAME,
				refdocTypeData.name,
				refdocId
			);
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
		return { url, refdocId: refdocId };
	}

	async getUserRefdocDetails(request: any) {
		let { userid, channelId } = request.headers;
		let selfRefdocs = await this.docDaoService.getUsersAllRefdocs(userid);
		const selfrefdocIds = selfRefdocs.map((ref) => ref.refdocId);
		let participant = await this.docDaoService.getUserRefdocDataAsParticipant(userid);
		const participantRefdocIds = participant.map((participantRefdoc) => participantRefdoc.refdocId);
		let paymentRequested = await this.participantDaoService.getPaymentRequestDataByPayeeUserIdAndStatus(userid, [
			RequestStatusEnum.REQUESTED,
			RequestStatusEnum.APPROVED
		]);
		const payeeRefdocIds = paymentRequested.map((payeeRefdoc) => payeeRefdoc.refdocId);
		const payeeRefdocs = await this.docDaoService.getUsersDataAsPaymentRequested(payeeRefdocIds);
		const refdocIdToStatusMapping = await this.docHelperService.getRefdocStatusByIds(
			selfrefdocIds,
			participantRefdocIds,
			payeeRefdocIds,
			userid
		);
		let allData = [...selfRefdocs, ...participant, ...payeeRefdocs];
		allData.forEach((refdoc) => {
			refdoc["overAllStatus"] = refdocIdToStatusMapping[refdoc.refdocId];
		});
		const stateCodeToNameMapping = await this.commonUtilityService.getStateCodeToNameMapping();
		allData.sort((a, b) => {
			let keyA = new Date(a.updatedAt),
				keyB = new Date(b.updatedAt);

			if (keyA < keyB) return 1;
			if (keyA > keyB) return -1;
			return 0;
		});
		const configs = await this.configurationService.getChannelConfigurations(channelId);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT) || "MM-DD-YYYY";
		allData.forEach((data) => {
			data["state"] = stateCodeToNameMapping[data["state"]];
			data["validFrom"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data["validFrom"],
				dateFormat
			);
			data["validTo"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(data["validTo"], dateFormat);
			data["verifiedAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data["verifiedAt"],
				dateFormat
			);
			data["rentDueDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data["rentDueDate"],
				dateFormat
			);
			data["rentPaymentDueDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data["rentPaymentDueDate"],
				dateFormat
			);
		});
		return allData;
	}

	async getRefdocStatus(refdocId: number, userId: number, isPayee = false) {
		const refdoc = await this.docDaoService.getRefdocById(refdocId);
		if (!refdoc) {
			throw new HttpException({ status: ResponseData.REFDOC_NOT_FOUND }, HttpStatus.OK);
		}
		if (refdoc.status !== RefdocMasterStatusEnum.APPROVED) {
			return refdoc.status.toString();
		}
		const masterProofs = isPayee
			? await this.docDaoService.getMasterProofsByPayeeIdAndRefdocId(userId, refdocId)
			: await this.docDaoService.getMasterProofsByUserIdAndRefdocId(refdocId, userId);
		if (!masterProofs.length) {
			return RefdocOverallStatusEnum.PAYMENT_OPTIONS_UPLOAD_PENDING;
		}
		const masterProofIds = [];
		const approvedMasterProofs = masterProofs.filter((masterProof) => {
			masterProofIds.push(masterProof.id);
			return masterProof.status === ProofStatus.APPROVED;
		});
		if (!approvedMasterProofs.length) {
			return RefdocOverallStatusEnum.PAYMENT_OPTIONS_APPROVAL_PENDING;
		}
		const monthlyProofs = await this.monthlyDocDaoService.getMonthlyProofByMasterProofIds(masterProofIds);
		let isMonthlyProofUploadPending = false;
		let isMonthlyProofApprovalPending = false;
		monthlyProofs.forEach((monthlyProof) => {
			if (monthlyProof.status === MonthlyProofStatusEnum.UPLOAD_PENDING) {
				isMonthlyProofUploadPending = true;
			} else if (monthlyProof.status === MonthlyProofStatusEnum.REQUESTED) {
				isMonthlyProofApprovalPending = true;
			}
		});
		if (isMonthlyProofUploadPending) {
			return RefdocOverallStatusEnum.MONTHLY_PROOFS_UPLOAD_PENDING;
		}
		if (isMonthlyProofApprovalPending) {
			return RefdocOverallStatusEnum.MONTHLY_PROOFS_APPROVAL_PENDING;
		}
		return RefdocOverallStatusEnum.APPROVED;
	}

	async getRejectionReasons() {
		return await this.docDaoService.getRefdocRejectionReasons();
	}

	async getNotSignedOptions() {
		return await this.docDaoService.getNotSignedOptions();
	}

	async getMoneyOrderSources() {
		return await this.docDaoService.getMoneyOrderSources();
	}

	async getLeaseFormats() {
		return await this.docDaoService.getLeaseFormats();
	}

	async getRefdocFullDetails(getRefdocDetailDto: RefDocIdDto, request: any) {
		const { refdocId } = getRefdocDetailDto;
		const { userid, channelId } = request.headers;
		const configs = await this.configurationService.getChannelConfigurations(channelId);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT) || "MM-DD-YYYY";
		const approvedStatus = [
			RefdocMasterStatusEnum.PROPOSED_TO_APPROVE,
			RefdocMasterStatusEnum.PROPOSED_TO_REJECT,
			RefdocMasterStatusEnum.INTERMEDIATE_REJECTION
		];
		const currencyFormattingData = await this.commonUtilityService.getDataforCurrencyFormatting(configs);
		const refdocDetails = await this.docHelperService.getRefdocFullDetails(refdocId, dateFormat, currencyFormattingData);
		let participantsData = await this.participantDaoService.getParticipantsDataByRefdocIds([refdocId]);
		participantsData = approvedStatus.includes(refdocDetails.status)
			? participantsData.filter((participant) => {
					if (participant.status == RequestStatusEnum.NEW_PARTICIPANT) {
						return false;
					}
					participant.status = RequestStatusEnum.VERIFICATION_PENDING;
					participant.statusDesc = "Verification Pending";
					return true;
			  })
			: participantsData;
		const primaryUserData = await this.docDaoService.getRefdocPrimaryUserDetails(refdocId);
		const allParticipantsData = [...participantsData, primaryUserData];
		allParticipantsData.forEach((participantData) => {
			if (participantData.participantUserId === userid.toString()) {
				this.docHelperService.addRefdocUsersForApp(participantData, refdocId, userid);
			}
		});
		let { benificiaryUserId, userType } = await this.docHelperService.validateUserForRefdoc(
			participantsData,
			primaryUserData,
			userid,
			refdocId
		);
		const subscriptionTxnData = await this.packageDaoService.getSubscriptionTxnData(userid, refdocId);
		const masterProofData = await this.docHelperService.getUserMasterProofsForRefdoc(refdocId, userid, dateFormat);
		const monthLastDate = this.commonUtilityService.getLastDateOfMonth(new Date());
		const paymentSchedule = approvedStatus.includes(refdocDetails.status)
			? []
			: await this.docHelperService.getPaymentScheduleWithDisputes(
					refdocId,
					monthLastDate,
					userid,
					dateFormat,
					benificiaryUserId
			  );
		subscriptionTxnData.forEach((data) => {
			data["renewalMonth"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data["renewalMonth"],
				dateFormat
			);
			data["validTill"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data["validTill"],
				dateFormat
			);
		});
		masterProofData.forEach((data) => {
			data["verifiedAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data["verifiedAt"],
				dateFormat
			);
			data["validTill"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data["validTill"],
				dateFormat
			);
		});
		let lookBackAllowed = false;
		const plaidMasterProofs = await this.docDaoService.getMasterProofByUserRefdocMasterProofTypeAndStatus(
			userid,
			refdocId,
			MasterProofTypeEnum.PLAID,
			ProofStatus.APPROVED
		);
		paymentSchedule.forEach((data) => {
			if (data.status === PaymentScheduleStatus.NEW && plaidMasterProofs.length) {
				lookBackAllowed = true;
			}
			data["dueDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(data["dueDate"], dateFormat);
			data["paymentDueDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data["paymentDueDate"],
				dateFormat
			);
		});
		allParticipantsData.forEach((participant) => {
			participant.mobile = this.commonUtilityService.formatMobileNumber(participant.mobile);
			participant.emailId = this.commonUtilityService.formatEmail(participant.emailId);
			participant.name = this.commonUtilityService.capitalizeWords(participant.name);
		});
		const userInfo = await this.userDaoService.getUserInfoByUserIdAndUserType(benificiaryUserId, UserType.CONSUMER);
		benificiaryUserId = userInfo.systemUserId;
		return {
			participants: allParticipantsData,
			subscriptionTxnData,
			masterProofData,
			paymentSchedule,
			refdocDetails,
			benificiaryUserId,
			userType,
			lookBackAllowed
		};
	}

	async deleteMasterProofStatus(updateMasterProofDto: UpdateMasterProofDto) {
		const { masterProofId } = updateMasterProofDto;
		const masterProof = await this.docDaoService.getMasterProofByIdandStatus(masterProofId, ProofStatus.APPROVED);
		masterProof.updateStatus(ProofStatus.INACTIVE);
		this.docDaoService.saveValidationDocMasterData(masterProof);
	}

	async refdocDataComplete(refdocIdDto: RefDocIdDto, request) {
		const userInfo = request[VariablesConstant.USER_DETAIL_MODEL];
		const { userId } = userInfo.userId;
		const { refdocId } = refdocIdDto;
		const refdoc = await this.docDaoService.getUserRefdocMasterDataByRefdoc(userId, refdocId);
		if (refdoc.documentPath) refdoc.status = RefdocMasterStatusEnum.REQUESTED;
		else refdoc.status = RefdocMasterStatusEnum.LEASE_PENDING;
		await this.docDaoService.saveRefdocMaster(refdoc);
	}

	async refdocHistoryData(refDocIdDto: RefDocIdDto, request: any) {
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const channelId = userDetailModel?.channelId;
		const { refdocId } = refDocIdDto;
		const configs = await this.configurationService.getChannelConfigurations(channelId);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT) || "MM-DD-YYYY";
		return await this.docHelperService.getRefdocHistoryData(refdocId, dateFormat);
	}

	async refdocHistoryDataBackoffice(refDocIdDto: RefDocIdDto) {
		const { refdocId } = refDocIdDto;
		const userInfo = await this.userDaoService.getUserInfoByRefdocId(refdocId);
		const configs = await this.configurationService.getChannelConfigurations(userInfo.channelId);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATETIME_FORMAT) || "MM-DD-YYYY";
		return await this.docHelperService.getRefdocHistoryData(refdocId, dateFormat);
	}

	async getDropdownOptions(getDropdownOptionsDto: GetDropDownOptionsDto) {
		const { dropdownName, pageName } = getDropdownOptionsDto;
		return await this.docDaoService.getDropdownOptions(dropdownName, pageName);
	}
}
