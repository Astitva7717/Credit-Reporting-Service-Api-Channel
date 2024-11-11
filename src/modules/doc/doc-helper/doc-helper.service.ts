import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ApproveRefDocDto, Participant, ParticipantBackofficeEnum, PaymentScheduleType } from "../dto/approve-ref-doc.dto";
import { RefdocMaster, RefdocMasterStatusEnum } from "../entities/refdoc-master.entity";
import { ResponseData } from "@utils/enums/response";
import { DocDaoService } from "@modules/dao/doc-dao/doc-dao.service";
import { PaymentSchedule, PaymentScheduleStatus } from "../entities/payment-schedule.entity";
import { RefdocDetails } from "../entities/refdoc-details.entity";
import {
	KafkaEventMessageDto,
	InviteUserParams,
	KafkaEventTypeEnum,
	LeaseEventParams,
	InboxDeepLinkParams,
	MonthlyProofDueEventParams
} from "@kafka/dto/kafka-event-message.dto";
import { ParticipantDaoService } from "@modules/dao/participant-dao/participant-dao.service";
import {
	InviteMethodType,
	LeaseParticipantType,
	MonthlyProofStatusEnum,
	ParticipantActionTypeEnum,
	ParticipantUserType,
	RefdocOverallStatusEnum,
	RefdocUserStatusEnum,
	RentDetailsStatusEnum,
	RentPaymentByEnum,
	RequestStatusEnum,
	Status,
	UserProfileStatusEnum,
	YNStatusEnum,
	YesNoEnum
} from "@utils/enums/Status";
import { UserMasterEntity } from "@modules/user-master/entities/user-master.entity";
import { UserDaoService } from "@modules/dao/user-dao/user-dao.service";
import { UserType } from "@utils/enums/user-types";
import { MasterProofTypeEnum, ProofStatus, ValidationDocMasterProof } from "../entities/validation-doc-master-proof.entity";
import { NotificationProducerService } from "@kafka/producer/notification-producer/notification-producer-service";
import { ParticipantMapRequest } from "@modules/participant/entities/participant-map-request.entity";
import { CommonUtilityService } from "@utils/common/common-utility/common-utility.service";
import { LeaseParticipant, RentDetailsDto } from "../dto/rent-details.dto";
import { UserProfileProgress } from "@modules/user-master/entities/user-profile-progress-status.entity";
import { PaymentUsersMappingRequest } from "@modules/participant/entities/payment-user-mapping-request.entity";
import { PackageDaoService } from "@modules/dao/package-dao/package-dao.service";
import { SaveMasterProofDto } from "../dto/save-master-proof.dto";
import { MemoryStorageFile } from "@blazity/nest-file-fastify";
import { PlaidAuthDaoService } from "@modules/dao/plaid-auth-dao/plaid-auth-dao.service";
import { ConfigurationService } from "@utils/configuration/configuration.service";
import { MonthlyDocDaoService } from "@modules/dao/monthly-doc-dao/monthly-doc-dao.service";
import { ValidationDocMonthlyProof } from "@modules/monthly-proof/entities/validation-doc-monthly-proof.entity";
import { ConfigService } from "src/config";
import { DisputeDaoService } from "@modules/dao/dispute-dao/dispute-dao.service";
import { MonthlyProofTypeEnum } from "@utils/enums/txn-types";
import { MonthMapEnum } from "@utils/constants/map-month-constants";
import { ConfigCodeEnum } from "@utils/enums/constants";
import { AliasDaoService } from "@modules/dao/alias-dao/alias-dao.service";
import { RefdocHistory } from "../entities/refdoc-history.entity";
import { SaveRentPaymentDetails } from "../dto/rent-payment-details.dto";
import { DataSource, QueryRunner } from "typeorm";
import { ScreenNames } from "@utils/enums/communication-enums";
import { DocTypeRefdocEnum } from "@utils/enums/user-communication";
import { RefdocUsersEntity } from "../entities/refdoc-users.entity";
import { UserPaymentSchedule, UserPaymentScheduleStatus } from "../entities/user-payment-schedule.entity";
import { PlaidService } from "@modules/plaid/plaid.service";
import { ReportingDaoService } from "@modules/dao/reporting-dao/reporting-dao.service";
import {
	ReportingStatus,
	UserCreditReportingRequests
} from "@modules/reporting/entities/user-credit-reporting-request.entity";
import VariablesConstant from "@utils/variables-constant";

@Injectable()
export class DocHelperService {
	constructor(
		private readonly docDaoService: DocDaoService,
		private readonly configService: ConfigService,
		private readonly participantDaoService: ParticipantDaoService,
		private readonly userDaoService: UserDaoService,
		private readonly notificationProducerService: NotificationProducerService,
		private readonly commonUtilityService: CommonUtilityService,
		private readonly packageDaoService: PackageDaoService,
		private readonly plaidDaoService: PlaidAuthDaoService,
		private readonly plaidService: PlaidService,
		private readonly configurationService: ConfigurationService,
		private readonly monthlyDocDaoService: MonthlyDocDaoService,
		private readonly disputeDaoService: DisputeDaoService,
		private readonly aliasDaoService: AliasDaoService,
		private readonly dataSource: DataSource,
		private readonly reportingRequestDaoService: ReportingDaoService
	) {}

	async verifyRefdocFromBackoffice(approveRefDocDto: ApproveRefDocDto, verifiedBy: number) {
		let { refdocId, status, rejectedReasonId, remark } = approveRefDocDto;
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			if (status === RefdocMasterStatusEnum.APPROVED || status === RefdocMasterStatusEnum.PROPOSED_TO_APPROVE) {
				await this.refdocApprovalFromBO(approveRefDocDto, verifiedBy, queryRunner);
			} else if (status === RefdocMasterStatusEnum.REJECTED || status === RefdocMasterStatusEnum.PROPOSED_TO_REJECT) {
				if (!rejectedReasonId || !remark) {
					throw new HttpException(
						{ data: {}, status: ResponseData.REMARK_NECESSARY_WHILE_REJECTING },
						HttpStatus.OK
					);
				}
				await this.rejectRefdocMaster(approveRefDocDto, verifiedBy, queryRunner);
			} else {
				throw new HttpException({ data: {}, status: ResponseData.INVALID_STATUS }, HttpStatus.OK);
			}
			if (status === RefdocMasterStatusEnum.APPROVED || status === RefdocMasterStatusEnum.REJECTED) {
				const refdocData = await this.docDaoService.getRefdocByQueryRunner(queryRunner, refdocId);
				await this.saveRefdocHistoryDataByQueryRunner(refdocData, queryRunner);
			}

			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	async refdocApprovalFromBO(approveRefDocDto: ApproveRefDocDto, verifiedBy: number, queryRunner: QueryRunner) {
		let {
			businessId,
			refdocId,
			status,
			firstName,
			lastName,
			ownerName,
			participants,
			addressOne,
			addressTwo,
			rentDueDay,
			rentPaymentDueDay,
			city,
			state,
			zip,
			validFrom,
			validTo,
			rentAmount,
			baseAmount,
			paymentSchedule
		} = approveRefDocDto;
		if (
			!businessId ||
			!firstName ||
			!lastName ||
			!ownerName ||
			!participants ||
			!addressOne ||
			!addressTwo ||
			!rentDueDay ||
			!rentPaymentDueDay ||
			!city ||
			!state ||
			!zip ||
			!validFrom ||
			!validTo ||
			!rentAmount ||
			!baseAmount ||
			!paymentSchedule
		) {
			throw new HttpException({ data: {}, status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		const refdocStatus =
			status === RefdocMasterStatusEnum.APPROVED
				? [RefdocMasterStatusEnum.PROPOSED_TO_APPROVE, RefdocMasterStatusEnum.PROPOSED_TO_REJECT]
				: [RefdocMasterStatusEnum.REQUESTED];
		const refdocData = await this.docDaoService.getRefdocMasterData(refdocId, refdocStatus);
		const { paymentScheduleArr, rentDueDate, rentPaymentDueDate } = await this.verifyPaymentSchedule(
			approveRefDocDto,
			verifiedBy,
			refdocData
		);
		const { approvedParticipants, participantsDbObject } = await this.verifyParticipant(
			approveRefDocDto,
			refdocId,
			queryRunner
		);
		await this.approveRefDoc(
			approveRefDocDto,
			verifiedBy,
			paymentScheduleArr,
			rentDueDate,
			rentPaymentDueDate,
			refdocData.userId,
			queryRunner
		);
		if (status === RefdocMasterStatusEnum.APPROVED) {
			const { aliasName } = await this.aliasDaoService.getAliasDataByUserId(refdocData.userId);
			const userInfo = await this.userDaoService.getUserInfoByUserId(refdocData.userId);
			const configs = await this.configurationService.getChannelConfigurations(userInfo.channelId);
			const mobileCode = configs.get(ConfigCodeEnum.COUNTRY_CODE) || "+91";
			const refdocTypeData = await this.docDaoService.getRefDocTypeById(refdocData.refdocTypeId);
			await this.saveUserPaymentSchedule(paymentScheduleArr, refdocData.userId, queryRunner, verifiedBy, refdocId);
			await this.participantDaoService.updatePaymentMapRequestsStatusByRefdocId(
				refdocId,
				RequestStatusEnum.REQUESTED,
				queryRunner
			);
			this.sendPaymentUserInvitation(businessId, refdocId, aliasName, mobileCode);
			for (let participant of approvedParticipants) {
				let participantDataDb = participantsDbObject[participant?.id];
				this.approveParticipantSendEvent(
					refdocId,
					businessId,
					participant,
					participantDataDb,
					aliasName,
					mobileCode
				);
			}
			this.sendUserEvent(
				userInfo,
				refdocTypeData.name,
				KafkaEventTypeEnum.VERFICATION_SUCCESSFUL,
				aliasName,
				DocTypeRefdocEnum.LEASE,
				ScreenNames.LEASE_SCREEN_NAME,
				refdocId
			);
		}
	}

	async approveRefDoc(
		approveRefDocDto: ApproveRefDocDto,
		verifiedBy: number,
		paymentScheduleArr: PaymentSchedule[],
		rentDueDate: any,
		rentPaymentDueDate: any,
		userId: number,
		queryRunner: QueryRunner
	) {
		const { refdocId, extraDetails, status } = approveRefDocDto;
		if (status === RefdocMasterStatusEnum.PROPOSED_TO_APPROVE) {
			const refdocDetails = await this.createRefdocInterimData(approveRefDocDto, verifiedBy, paymentScheduleArr);
			const refdocMasterData = new RefdocMaster(
				refdocDetails.userId,
				refdocDetails.refdocTypeId,
				refdocDetails.documentPath,
				refdocDetails.addressOne,
				refdocDetails.addressTwo,
				refdocDetails.status,
				refdocDetails.baseAmount
			);
			refdocMasterData.refdocId = refdocDetails.refdocId;
			refdocMasterData.updateAddressDetails(refdocDetails.city, refdocDetails.state, refdocDetails.zip);
			refdocMasterData.updateDocumentPath(refdocDetails.documentPath);
			refdocMasterData.updateRefdocDetails(
				refdocDetails.validFrom,
				refdocDetails.validTo,
				refdocDetails.rentAmount,
				refdocDetails.rejectedReasonId,
				refdocDetails.rentDueDay,
				refdocDetails.rentPaymentDueDay
			);
			refdocMasterData.updateRefdocRemark(refdocDetails.remark);
			refdocMasterData.updateUploadAndApproveDetails(refdocDetails.uploadedDate, refdocDetails.approvedDate);
			refdocMasterData.updateVerifingUserDetail(refdocDetails.verifiedBy, refdocDetails.verifiedAt);
			refdocMasterData.updateCustomerDetails(
				refdocDetails.firstName,
				refdocDetails.middleName,
				refdocDetails.lastName,
				refdocDetails.ownerName,
				refdocDetails.suffixName,
				refdocDetails.propertyName
			);
			await this.saveRefdocHistoryDataByQueryRunner(refdocMasterData, queryRunner);
			return await this.docDaoService.saveRefdocInterimDataAndStatus(
				queryRunner,
				approveRefDocDto.refdocId,
				JSON.stringify(refdocDetails),
				approveRefDocDto,
				userId
			);
		}
		await this.docDaoService.verifyRefdocMasterStatusAndOtherDetails(
			approveRefDocDto,
			verifiedBy,
			rentDueDate,
			rentPaymentDueDate,
			userId,
			queryRunner
		);
		await this.updatePaymentscheduleAndPlaidMonthlyProof(
			refdocId,
			userId,
			paymentScheduleArr,
			extraDetails,
			queryRunner
		);
	}

	async updatePaymentscheduleAndPlaidMonthlyProof(
		refdocId: number,
		userId: number,
		paymentScheduleArr,
		extraDetails,
		queryRunner: QueryRunner
	) {
		const formattedTodayDate = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			new Date(),
			"YYYY-MM-DD"
		);

		const refdocSubscriptionTnxs = await this.packageDaoService.getUserAllSubscriptionTxnsForRefdoc(userId, refdocId);
		const refdocSubscriptions: string[] = refdocSubscriptionTnxs.map(
			(subscription) => `${subscription.subscriptionMonth}-${subscription.subscriptionYear}`
		);
		const masterProofData = await this.docDaoService.getMasterProofDataByRefdocIdAndMasterProofType(
			refdocId,
			ProofStatus.APPROVED,
			MasterProofTypeEnum.PLAID
		);
		await this.updateMonthlyProofForPlaid(
			paymentScheduleArr,
			refdocSubscriptions,
			formattedTodayDate,
			masterProofData,
			extraDetails,
			refdocId,
			queryRunner
		);
	}

	async updateMonthlyProofForPlaid(
		paymentScheduleArr,
		refdocSubscriptions,
		formattedTodayDate,
		masterProofData,
		extraDetails,
		refdocId,
		queryRunner: QueryRunner
	) {
		const montlyProofData: ValidationDocMonthlyProof[] = [];
		for (let paymentSchedule of paymentScheduleArr) {
			const paymentSchMonthYear = `${paymentSchedule.month}-${paymentSchedule.year}`;
			const formattedDueDate = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				paymentSchedule.dueDate,
				"YYYY-MM-DD"
			);
			if (
				refdocSubscriptions.includes(paymentSchMonthYear) &&
				formattedDueDate <= formattedTodayDate &&
				paymentSchedule.status === PaymentScheduleStatus.NEW
			) {
				paymentSchedule.status = PaymentScheduleStatus.DUE;
				await this.createMonthlyProof(masterProofData, paymentSchedule, montlyProofData);
			}
		}
		if (montlyProofData.length) {
			await this.monthlyDocDaoService.insertMonthlyProofDetailsByQueryRunner(montlyProofData, queryRunner);
		}
		await this.docDaoService.savePaymentSchedule(paymentScheduleArr, queryRunner);
		if (extraDetails) {
			await this.addRefdocDetails(refdocId, extraDetails, queryRunner);
		}
	}

	async createMonthlyProof(masterProofData, paymentSchedule, montlyProofData) {
		for (let masterProof of masterProofData) {
			const monthlyProof: ValidationDocMonthlyProof = new ValidationDocMonthlyProof(
				masterProof.userId,
				masterProof.id,
				masterProof.monthlyProofType,
				0,
				this.commonUtilityService.getFirstDateOfMonth(new Date(paymentSchedule.dueDate)),
				masterProof.monthlyProofType === MonthlyProofTypeEnum.RECEIPT
					? MonthlyProofStatusEnum.UPLOAD_PENDING
					: MonthlyProofStatusEnum.DATA_FETCH_PENDING
			);
			const { month, year } = this.commonUtilityService.getMonthAndYearFromDate(new Date(paymentSchedule.dueDate));
			const dueDate = new Date(paymentSchedule.dueDate);
			const nextMonthDueDate = this.commonUtilityService.getLastDateOfMonth(dueDate);
			monthlyProof.fetchTill = new Date(nextMonthDueDate);
			const monthName = MonthMapEnum[month.toString()];
			monthlyProof.updateRefdocDueDates(monthName, year);
			montlyProofData.push(monthlyProof);
		}
	}

	async addReportingRequest(userId: number, refdocId: number, scheduleIds: number[], queryRunner: QueryRunner) {
		const schedules = await this.docDaoService.getUserPaymentScheduleById(scheduleIds, queryRunner);
		const userReportingRequests: UserCreditReportingRequests[] = [];
		for (let schedule of schedules) {
			const subscription = await this.packageDaoService.getUserSubscriptionForMonthAndYearForRefdoc(
				userId,
				refdocId,
				schedule.month,
				schedule.year
			);
			if (subscription) {
				const userReportingRequest = new UserCreditReportingRequests(
					userId,
					schedule.id,
					refdocId,
					ReportingStatus.AMOUNT_DUE
				);
				userReportingRequests.push(userReportingRequest);
			}
		}
		await this.reportingRequestDaoService.saveMultipleReportingRequest(userReportingRequests, queryRunner);
	}

	async saveUserPaymentSchedule(
		paymentScheduleArr: PaymentSchedule[],
		userId: number,
		queryRunner: QueryRunner,
		verifiedBy: number,
		refdocId: number
	) {
		let userPaymentSchedules = paymentScheduleArr.reduce((userPaymentSchedules, paymentSchedule) => {
			const userPaymentSchedule = new UserPaymentSchedule(
				paymentSchedule.id,
				userId,
				paymentSchedule.month,
				paymentSchedule.year,
				UserPaymentScheduleStatus[paymentSchedule.status],
				verifiedBy
			);
			userPaymentSchedules.push(userPaymentSchedule);
			return userPaymentSchedules;
		}, []);
		userPaymentSchedules = await this.docDaoService.saveUserPaymentScheduleByQueryRunner(
			userPaymentSchedules,
			queryRunner
		);
		let userPaymentScheduleIds = [];
		userPaymentSchedules.forEach((schedule) => {
			if (schedule.status === UserPaymentScheduleStatus.DUE) {
				userPaymentScheduleIds.push(schedule.id);
			}
		});
		if (userPaymentScheduleIds.length)
			await this.addReportingRequest(userId, refdocId, userPaymentScheduleIds, queryRunner);
	}

	async saveUserPaymentScheduleForParticpant(userId: number, refdocId: number, queryRunner: QueryRunner) {
		const paymentSchedules = await this.docDaoService.getPaymentScheduleDataByRefdocId(refdocId);
		const userPaymentSchedules = paymentSchedules.reduce((userPaymentSchedules, paymentSchedule) => {
			const userPaymentSchedule = new UserPaymentSchedule(
				paymentSchedule.id,
				userId,
				paymentSchedule.month,
				paymentSchedule.year,
				UserPaymentScheduleStatus[paymentSchedule.status],
				paymentSchedule.createdBy
			);
			userPaymentSchedules.push(userPaymentSchedule);
			return userPaymentSchedules;
		}, []);
		await this.docDaoService.saveUserPaymentScheduleByQueryRunner(userPaymentSchedules, queryRunner);
	}

	async createRefdocInterimData(
		approveRefDocDto: ApproveRefDocDto,
		verifiedBy: number,
		paymentScheduleArr: PaymentSchedule[]
	) {
		const { refdocId, status, variableComponentLease } = approveRefDocDto;

		const refdocDetails = await this.docDaoService.getRefdocDetailsById(refdocId);
		this.updateRefdocDetails(refdocDetails, approveRefDocDto);
		const statusData = await this.docDaoService.getStatusDisplayName(status);
		refdocDetails["statusDesc"] = statusData.description;
		refdocDetails["variableComponentLease"] = variableComponentLease;
		refdocDetails["verifiedBy"] = verifiedBy;
		refdocDetails["verifiedAt"] = new Date();
		refdocDetails["paymentSchedule"] = paymentScheduleArr;
		refdocDetails["disputeData"] = [];
		refdocDetails["refdocUsers"] = [];
		return refdocDetails;
	}

	async updateRefdocDetails(refdocDetails, approveRefDocDto: ApproveRefDocDto) {
		refdocDetails.firstName = approveRefDocDto.firstName;
		refdocDetails.lastName = approveRefDocDto.lastName;
		refdocDetails.middleName = approveRefDocDto.middleName;
		refdocDetails.ownerName = approveRefDocDto.ownerName;
		refdocDetails.propertyName = approveRefDocDto.propertyName;
		refdocDetails.suffixName = approveRefDocDto.suffixName;
		refdocDetails.addressOne = approveRefDocDto.addressOne;
		refdocDetails.addressTwo = approveRefDocDto.addressTwo;
		refdocDetails.city = approveRefDocDto.city;
		refdocDetails.state = approveRefDocDto.state;
		refdocDetails.zip = approveRefDocDto.zip;
		refdocDetails.rejectedReasonId = approveRefDocDto.rejectedReasonId;
		refdocDetails.remark = approveRefDocDto.remark;
		refdocDetails.validFrom = approveRefDocDto.validFrom;
		refdocDetails.validTo = approveRefDocDto.validTo;
		refdocDetails.rentDueDay = approveRefDocDto.rentDueDay;
		refdocDetails.rentPaymentDueDay = approveRefDocDto.rentPaymentDueDay;
		refdocDetails.rentAmount = approveRefDocDto.rentAmount;
		refdocDetails.baseAmount = approveRefDocDto.baseAmount;
		refdocDetails.status = approveRefDocDto.status;
		refdocDetails["participantsDetails"] = approveRefDocDto.participants;
		refdocDetails["extraDetails"] = Object.keys(approveRefDocDto.extraDetails).map((extraDetailKey) => {
			return { key: extraDetailKey, value: approveRefDocDto?.extraDetails[extraDetailKey] };
		});
	}

	async addRefdocDetails(refdocId: number, extraDetails: any, queryRunner: QueryRunner) {
		const prevExtraDetails = await this.docDaoService.getRefdocExtraDetailsById(refdocId);
		const extraDetailMap: Map<string, RefdocDetails> = new Map();
		prevExtraDetails.forEach((extraDetail) => {
			extraDetailMap.set(extraDetail.key, extraDetail);
		});
		const refdocDetailsArr: RefdocDetails[] = [];
		Object.keys(extraDetails).forEach((newField) => {
			if (extraDetailMap.has(newField)) {
				const prevDetail = extraDetailMap.get(newField);
				prevDetail.value = extraDetails[newField];
				refdocDetailsArr.push(prevDetail);
			} else {
				let refdocDetailDto: RefdocDetails = new RefdocDetails(refdocId, newField, extraDetails[newField]);
				refdocDetailsArr.push(refdocDetailDto);
			}
		});
		await this.docDaoService.saveRefdocDetails(refdocDetailsArr, queryRunner);
	}

	async rejectRefdocMaster(approveRefDocDto: ApproveRefDocDto, verifiedBy: number, queryRunner: QueryRunner) {
		const { rejectedReasonId, refdocId, status } = approveRefDocDto;
		const refdocStatus =
			status === RefdocMasterStatusEnum.REJECTED
				? [
						RefdocMasterStatusEnum.PROPOSED_TO_APPROVE,
						RefdocMasterStatusEnum.PROPOSED_TO_REJECT,
						RefdocMasterStatusEnum.INTERMEDIATE_REJECTION
				  ]
				: [RefdocMasterStatusEnum.REQUESTED];
		const refdocData = await this.docDaoService.getRefdocMasterData(refdocId, refdocStatus);
		const { aliasName } = await this.aliasDaoService.getAliasDataByUserId(refdocData.userId);
		const rejectedReasonData = await this.docDaoService.getRejectionReasonData(rejectedReasonId, Status.ACTIVE);
		if (
			approveRefDocDto.status === RefdocMasterStatusEnum.PROPOSED_TO_REJECT ||
			(approveRefDocDto.status === RefdocMasterStatusEnum.REJECTED &&
				rejectedReasonId === 4 &&
				refdocData.status !== RefdocMasterStatusEnum.INTERMEDIATE_REJECTION)
		) {
			if (approveRefDocDto.status === RefdocMasterStatusEnum.REJECTED) {
				approveRefDocDto.status = RefdocMasterStatusEnum.INTERMEDIATE_REJECTION;
			}
			approveRefDocDto.participants = (await this.participantDaoService.getUserParticipantsRequestsInRefDoc(
				refdocId
			)) as any;

			const refdocDetails = await this.createRefdocInterimData(approveRefDocDto, verifiedBy, []);
			refdocDetails["rejectionReason"] = rejectedReasonData.reason;
			if (approveRefDocDto.status !== RefdocMasterStatusEnum.INTERMEDIATE_REJECTION) {
				const refdocMasterData = new RefdocMaster(
					refdocDetails.userId,
					refdocDetails.refdocTypeId,
					refdocDetails.documentPath,
					refdocDetails.addressOne,
					refdocDetails.addressTwo,
					refdocDetails.status,
					refdocDetails.baseAmount
				);
				refdocMasterData.refdocId = refdocDetails.refdocId;
				refdocMasterData.updateAddressDetails(refdocDetails.city, refdocDetails.state, refdocDetails.zip);
				refdocMasterData.updateDocumentPath(refdocDetails.documentPath);
				refdocMasterData.updateRefdocDetails(
					refdocDetails.validFrom,
					refdocDetails.validTo,
					refdocDetails.rentAmount,
					refdocDetails.rejectedReasonId,
					refdocDetails.rentDueDay,
					refdocDetails.rentPaymentDueDay
				);
				refdocMasterData.updateRefdocRemark(refdocDetails.remark);
				refdocMasterData.updateUploadAndApproveDetails(refdocDetails.uploadedDate, refdocDetails.approvedDate);
				refdocMasterData.updateVerifingUserDetail(refdocDetails.verifiedBy, refdocDetails.verifiedAt);
				await this.saveRefdocHistoryDataByQueryRunner(refdocMasterData, queryRunner);
			}

			return await this.docDaoService.saveRefdocInterimDataAndStatus(
				queryRunner,
				approveRefDocDto.refdocId,
				JSON.stringify(refdocDetails),
				approveRefDocDto,
				refdocData.userId
			);
		}

		const rejectionCount = refdocData.rejectionCount;
		await this.docDaoService.verifyRefdocMasterStatus(approveRefDocDto, verifiedBy, queryRunner, rejectionCount);
		if (status === RefdocMasterStatusEnum.REJECTED) {
			const userInfo = await this.userDaoService.getUserInfoByUserId(refdocData.userId);
			const refdocTypeData = await this.docDaoService.getRefDocTypeById(refdocData.refdocTypeId);
			this.sendUserEvent(
				userInfo,
				refdocTypeData.name,
				KafkaEventTypeEnum.VERFICATION_FAILED,
				aliasName,
				DocTypeRefdocEnum.LEASE,
				ScreenNames.LEASE_SCREEN_NAME,
				refdocId
			);
		}
	}

	async sendPaymentUserInvitation(businessId: number, refdocId: number, aliasName: string, mobileCode: string) {
		const kafkaEventMessageDto: KafkaEventMessageDto[] = [];
		const frontendBaseUrl = this.configService.get("CRYR_FRONTEND_BASE_URL");
		const invitedUrlKey = "invited";
		const invitaionLink = `${frontendBaseUrl}/${invitedUrlKey}`;
		const paymentUsersDb = await this.participantDaoService.getPaymentUserDataByRefdocIds([refdocId]);

		for (const paymentUser of paymentUsersDb) {
			const invitaionCode = paymentUser?.verificationCode;
			let paymentUserInfo: UserMasterEntity;

			if (paymentUser?.emailId) {
				paymentUserInfo = await this.userDaoService.getUserInfoByEmailId(paymentUser?.emailId);
			} else if (paymentUser?.mobile) {
				paymentUserInfo = await this.userDaoService.getUserInfoByMobile(mobileCode, paymentUser?.mobile);
			}

			const primaryUserInfo = await this.userDaoService.getUserInfoByUserId(paymentUser?.userId);
			const primaryUserFullName =
				primaryUserInfo.firstName + (primaryUserInfo?.lastName ? " " + primaryUserInfo?.lastName : "");
			const kafkaEventMessageDtoObj = new KafkaEventMessageDto(
				aliasName,
				primaryUserInfo?.currencyCode,
				paymentUser?.mobile,
				paymentUser?.emailId,
				paymentUserInfo?.userType
			);
			kafkaEventMessageDtoObj.addDetails(paymentUserInfo ? paymentUserInfo?.userId : null, businessId);
			const params: InviteUserParams = {
				invitationCode: invitaionCode,
				invitationLink: invitaionLink,
				userName: primaryUserFullName
			};
			kafkaEventMessageDtoObj.addParmas(params);
			kafkaEventMessageDto.push(kafkaEventMessageDtoObj);
		}
		this.sendUserInvitation(kafkaEventMessageDto);
	}

	async sendUserInvitation(kafkaEventMessageDto: KafkaEventMessageDto[]) {
		if (kafkaEventMessageDto.length) {
			this.sendInvitaionKafkaRequest(kafkaEventMessageDto, KafkaEventTypeEnum.INVITE_USER);
		}
	}

	sendInvitaionKafkaRequest(requests: KafkaEventMessageDto[], eventType: KafkaEventTypeEnum) {
		requests.forEach((request) => {
			this.notificationProducerService.InviteParticipant(request, eventType);
		});
	}

	async verifyParticipant(approveRefDocDto: ApproveRefDocDto, refdocId: number, queryRunner: QueryRunner) {
		let { participants } = approveRefDocDto;
		const participantDbData = await this.createParticipantDbObject(refdocId);
		const participantsDbObject = participantDbData.participantsDbObject;
		const newParticipantIds = participantDbData.newParticipantIds;
		for (let participant of participants) {
			if (
				participant.status !== ParticipantBackofficeEnum.NEW_PARTICIPANT &&
				!Object.keys(participantsDbObject).includes(participant?.id?.toString())
			) {
				throw new HttpException({ data: {}, status: ResponseData.INVALID_PARTICIPANT_DATA }, HttpStatus.OK);
			}
		}
		const approvedParticipants: Participant[] = await this.updateParticipants(
			approveRefDocDto,
			refdocId,
			queryRunner,
			participantsDbObject,
			newParticipantIds
		);
		return { approvedParticipants, participantsDbObject };
	}

	async updateParticipants(
		approveRefDocDto: ApproveRefDocDto,
		refdocId: number,
		queryRunner: QueryRunner,
		participantsDbObject: any,
		newParticipantIds: any[]
	) {
		const { participants, status } = approveRefDocDto;
		const participantMappingRequest: ParticipantMapRequest[] = [];
		const approvedParticipants: Participant[] = [];
		for (let participant of participants) {
			if (participant?.status === ProofStatus.APPROVED) {
				if (status === RefdocMasterStatusEnum.APPROVED) {
					await this.participantDaoService.updateParticipantMapRequestsStatus(
						refdocId,
						participant?.id,
						RequestStatusEnum.REQUESTED,
						queryRunner
					);
				}
				approvedParticipants.push(participant);
			} else if (participant?.status === ProofStatus.REJECTED && status === RefdocMasterStatusEnum.APPROVED) {
				await this.participantDaoService.updateParticipantMapRequestsStatus(
					refdocId,
					participant?.id,
					RequestStatusEnum.REJECTED,
					queryRunner,
					participant?.rejectedReasonId
				);
			} else if (participant?.status === ParticipantBackofficeEnum.NEW_PARTICIPANT) {
				participantMappingRequest.push(await this.addParticipantRequest(participant, refdocId));
			}
		}

		if (participantMappingRequest.length && status === RefdocMasterStatusEnum.APPROVED) {
			await this.participantDaoService.createMultipleParticipantMapRequest(participantMappingRequest, queryRunner);
		}
		if (newParticipantIds.length) {
			await this.participantDaoService.updateInvitedParticipantStatusByIds(newParticipantIds, queryRunner);
		}
		return approvedParticipants;
	}

	async addParticipantRequest(participant: Participant, refdocId: number) {
		const { name } = participant;
		const invitaionCode = await this.generateVerificationCode(6);
		const refdocDetails = await this.docDaoService.getRefdocById(refdocId);
		const participantMapRequest = new ParticipantMapRequest(
			refdocDetails?.userId,
			null,
			name,
			null,
			null,
			invitaionCode,
			0
		);
		participantMapRequest.addParticiapntDetails(
			null,
			refdocId,
			null,
			ParticipantActionTypeEnum.ADD,
			RequestStatusEnum.NEW_PARTICIPANT
		);
		return participantMapRequest;
	}

	async createParticipantDbObject(refdocId: number) {
		const participantsDb = await this.participantDaoService.getParticipantsDataByRefdocIds([refdocId]);
		const participantsDbObject = {};
		const newParticipantIds = [];
		participantsDb.forEach((participantDb) => {
			participantsDbObject[participantDb.id] = participantDb;
			if (participantDb.status === RequestStatusEnum.NEW_PARTICIPANT) {
				newParticipantIds.push(participantDb.id);
			}
		});
		return { participantsDbObject, newParticipantIds };
	}
	async approveParticipantSendEvent(
		refdocId: number,
		businessId: number,
		participant: Participant,
		participantDataDb: any,
		aliasName: string,
		mobileCode: string
	) {
		const kafkaEventMessageDto: KafkaEventMessageDto[] = [];
		const frontendBaseUrl = this.configService.get("CRYR_FRONTEND_BASE_URL");
		const invitedUrlKey = "invited";
		const invitaionLink = `${frontendBaseUrl}/${invitedUrlKey}`;
		let invitaionCode = participantDataDb?.verificationCode;
		let participantInfo: UserMasterEntity;
		if (participantDataDb?.emailId) {
			participantInfo = await this.userDaoService.getUserInfoByEmailId(participantDataDb?.emailId);
		} else if (participantDataDb?.mobile) {
			participantInfo = await this.userDaoService.getUserInfoByMobile(mobileCode, participantDataDb?.mobile);
		}
		const primaryUserInfo = await this.userDaoService.getUserInfoByUserId(participantDataDb?.userId);
		const primaryUserFullName =
			primaryUserInfo.firstName + (primaryUserInfo?.lastName ? " " + primaryUserInfo?.lastName : "");
		const kafkaEventMessageDtoObj = new KafkaEventMessageDto(
			aliasName,
			primaryUserInfo?.currencyCode,
			participantDataDb?.mobile,
			participantDataDb?.emailId,
			participantInfo ? participantInfo?.userType : UserType.CONSUMER
		);
		kafkaEventMessageDtoObj.addDetails(participantInfo ? participantInfo?.userId : null, businessId);
		const params: InviteUserParams = {
			invitationCode: invitaionCode,
			invitationLink: invitaionLink,
			userName: primaryUserFullName
		};
		kafkaEventMessageDtoObj.addParmas(params);
		kafkaEventMessageDto.push(kafkaEventMessageDtoObj);
		this.sendUserInvitation(kafkaEventMessageDto);
	}

	async generateVerificationCode(length: number) {
		let isUnique = false;
		let invitaionCode: string;
		while (!isUnique) {
			invitaionCode = this.commonUtilityService.generateRandomCode(length);
			let isCodeExist: boolean = false;
			isCodeExist =
				(await this.participantDaoService.checkVerificationCodeExistInPaymentRequest(invitaionCode)) ||
				(await this.participantDaoService.checkVerificationCodeExistInParticipantRequest(invitaionCode));
			if (!isCodeExist) {
				isUnique = true;
			}
		}
		return invitaionCode;
	}

	async verifyPaymentSchedule(approveRefDocDto: ApproveRefDocDto, verifiedBy: number, refdocData: RefdocMaster) {
		let rentDueDate, rentPaymentDueDate;
		const { refdocId, paymentSchedule, status } = approveRefDocDto;
		if (status === RefdocMasterStatusEnum.PROPOSED_TO_APPROVE) {
			const paymentScheduleArr = paymentSchedule.map((data) => {
				const currentMonth = new Date().getMonth();
				const currentYear = new Date().getFullYear();
				const dueDateMonth = new Date(data.dueDate).getMonth();
				const dueDateYear = new Date(data.dueDate).getFullYear();
				if (`${currentMonth}-${currentYear}` === `${dueDateMonth}-${dueDateYear}`) {
					rentDueDate = data.dueDate;
					rentPaymentDueDate = data.paymentDueDate;
				}
				const paymentScheduleData = new PaymentSchedule(
					refdocId,
					data.dueDate,
					data.paymentDueDate,
					data.amount,
					PaymentScheduleStatus.NEW
				);
				paymentScheduleData.updateMonthAndYear(MonthMapEnum[dueDateMonth + 1], dueDateYear);
				paymentScheduleData.updateModifiedAmount(data.modifiedAmount);
				paymentScheduleData.updateNotes(data.notes);
				paymentScheduleData.updateCreatedBy(verifiedBy);
				return paymentScheduleData;
			});

			return { paymentScheduleArr, rentDueDate, rentPaymentDueDate };
		}
		return await this.updatePaymentSchedule(approveRefDocDto, verifiedBy, refdocData);
	}

	async updatePaymentSchedule(approveRefDocDto: ApproveRefDocDto, verifiedBy: number, refdocData: RefdocMaster) {
		let rentDueDate, rentPaymentDueDate;
		const { refdocId, paymentSchedule } = approveRefDocDto;
		const savedPaymentSchedule = this.getPaymentScheduleDataFromInterimData(refdocData);
		const scheduleIdToScheduleMap: Map<string, PaymentSchedule> = new Map();
		savedPaymentSchedule.forEach((schedule) => {
			scheduleIdToScheduleMap.set(`${schedule.month}-${schedule.year}`, schedule);
		});
		const paymentScheduleArr = paymentSchedule.map((schedule) => {
			const currentMonth = new Date().getMonth();
			const currentYear = new Date().getFullYear();
			const dueDateMonth = new Date(schedule.dueDate).getMonth();
			const dueDateYear = new Date(schedule.dueDate).getFullYear();
			if (`${currentMonth}-${currentYear}` === `${dueDateMonth}-${dueDateYear}`) {
				rentDueDate = schedule.dueDate;
				rentPaymentDueDate = schedule.paymentDueDate;
			}
			const monthYear = `${MonthMapEnum[dueDateMonth + 1]}-${dueDateYear}`;
			if (scheduleIdToScheduleMap.has(monthYear)) {
				const previousScheduleData = scheduleIdToScheduleMap.get(monthYear);
				this.setVerifiedByIfUpdate(previousScheduleData, schedule, verifiedBy);
				previousScheduleData.amount = schedule.amount;
				previousScheduleData.dueDate = schedule.dueDate;
				previousScheduleData.paymentDueDate = schedule.paymentDueDate;
				previousScheduleData.modifiedAmount = schedule.modifiedAmount;
				previousScheduleData.notes = schedule.notes;
				scheduleIdToScheduleMap.delete(monthYear);
				return previousScheduleData;
			} else {
				const paymentScheduleData = new PaymentSchedule(
					refdocId,
					schedule.dueDate,
					schedule.paymentDueDate,
					schedule.amount,
					PaymentScheduleStatus.NEW
				);
				paymentScheduleData.updateMonthAndYear(MonthMapEnum[dueDateMonth + 1], dueDateYear);
				paymentScheduleData.updateCreatedBy(verifiedBy);
				return paymentScheduleData;
			}
		});
		scheduleIdToScheduleMap.forEach((schedule) => {
			schedule.status = PaymentScheduleStatus.INACTIVE;
			schedule.updatedBy = verifiedBy;
			schedule.updatedAt = new Date();
			paymentScheduleArr.push(schedule);
		});
		return { paymentScheduleArr, rentDueDate, rentPaymentDueDate };
	}

	getPaymentScheduleDataFromInterimData(refdoc: RefdocMaster) {
		const interimData = refdoc.interimData;
		if (interimData) {
			const data = JSON.parse(interimData);
			if (data.paymentSchedule) {
				return data.paymentSchedule;
			}
		}
		return [];
	}

	async setVerifiedByIfUpdate(
		previousScheduleData: PaymentSchedule,
		newSchedule: PaymentScheduleType,
		verifiedBy: number
	) {
		if (
			previousScheduleData.amount !== newSchedule.amount ||
			previousScheduleData.dueDate !== newSchedule.dueDate ||
			previousScheduleData.paymentDueDate !== newSchedule.paymentDueDate
		) {
			previousScheduleData.updatedBy = verifiedBy;
			previousScheduleData.updatedAt = new Date();
		}
	}

	async verifyMasterProofFromBackoffice(approveRefDocDto: ApproveRefDocDto, verifiedBy: number) {
		let { status, masterProofId, remark, rejectedReasonId, validTo, validFrom, amount } = approveRefDocDto;
		if (!masterProofId || !Object.keys(ProofStatus).includes(status)) {
			throw new HttpException({ data: {}, status: ResponseData.INVALID_MASTER_PROOF_ID }, HttpStatus.OK);
		}
		let masterProofData = await this.docDaoService.getMasterProofDataByIdAndStatus(masterProofId, ProofStatus.REQUESTED);
		const { aliasName } = await this.aliasDaoService.getAliasDataByUserId(masterProofData.userId);
		const { refdocType } = await this.docDaoService.getRefdocTypeByRefdocId(masterProofData.refdocId);
		const userInfo = await this.userDaoService.getUserInfoByUserId(masterProofData.userId);
		const { docTypeName } = await this.docDaoService.getPaymentTypeNameByPaymentType(masterProofData.paymentType);
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			if (status === RefdocMasterStatusEnum.REJECTED) {
				await this.docDaoService.getRejectionReasonData(rejectedReasonId, Status.ACTIVE);
				masterProofData.rejectedReason = rejectedReasonId;
				this.sendUserEvent(
					userInfo,
					refdocType,
					KafkaEventTypeEnum.VERFICATION_FAILED,
					aliasName,
					docTypeName,
					ScreenNames.MASTER_PROOF_SCREEN_NAME,
					masterProofData.refdocId
				);
			} else if (status === RefdocMasterStatusEnum.APPROVED) {
				if (!validTo) {
					throw new HttpException({ data: {}, status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
				}

				masterProofData.validTill = validTo;
				const proofDetail = JSON.parse(masterProofData.proofDetail) || {};
				proofDetail["validFrom"] = validFrom;
				proofDetail["amount"] = amount;
				masterProofData.proofDetail = JSON.stringify(proofDetail);
				await this.updateMonthlyProofForApprovedMasterProof(masterProofId, aliasName, queryRunner);
				this.sendUserEvent(
					userInfo,
					refdocType,
					KafkaEventTypeEnum.VERFICATION_SUCCESSFUL,
					aliasName,
					docTypeName,
					ScreenNames.MASTER_PROOF_SCREEN_NAME,
					masterProofData.refdocId
				);
			} else {
				throw new HttpException({ data: {}, status: ResponseData.INVALID_STATUS }, HttpStatus.OK);
			}
			masterProofData.status = ProofStatus[status];
			masterProofData.remark = remark || null;
			masterProofData.updateVerifingDetails(verifiedBy);
			await this.docDaoService.saveValidationDocMasterDataByQueryRunner(masterProofData, queryRunner);

			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	async updateMonthlyProofForApprovedMasterProof(masterProofId: number, aliasName: string, queryRunner: QueryRunner) {
		const fromDate = new Date(this.commonUtilityService.getFirstDateOfMonth(new Date()));
		const masterProofDetail = await this.docDaoService.getDueDateForMasterproof(masterProofId, fromDate, new Date());
		if (masterProofDetail) {
			if (masterProofDetail.paymentScheduleStatus === PaymentScheduleStatus.NEW) {
				this.monthlyDocDaoService.updatePaymentScheduleStatusByQueryRunner(
					queryRunner,
					masterProofDetail.paymentScheduleId,
					PaymentScheduleStatus.DUE
				);
			}
			const refdoc = await this.docDaoService.getRefdocById(masterProofDetail.refdocId);
			refdoc.rentDueDate = masterProofDetail.dueDate;
			refdoc.rentPaymentDueDate = masterProofDetail.paymentDueDate;
			await this.docDaoService.saveRefdocMasterByQueryRunner(refdoc, queryRunner);
			await this.sendMonthlyProofUploadEvent(
				refdoc.refdocTypeId,
				masterProofDetail.payeeId,
				masterProofDetail.paymentTypeName,
				aliasName,
				masterProofDetail.refdocId
			);
		}
	}

	async getParticipantDataForRefdoc(refdoc, piiPermissions) {
		const { emailPermission, phonePermission } = piiPermissions;
		refdoc["participantsDetails"] = await this.participantDaoService.getParticipantsDataByRefdocIds([refdoc.refdocId]);
		refdoc["refdocUsers"] = await this.getRefdocParticipantDetails(
			refdoc.refdocId,
			refdoc["participantsDetails"],
			refdoc["status"]
		);
		refdoc["participantsDetails"].push({
			isPrimary: "YES",
			name: refdoc.userFirstName + (refdoc?.userLastName ? " " + refdoc.userLastName : ""),
			emailId: refdoc.userEmail,
			mobile: refdoc.userMobileNumber
		});
		refdoc["participantsDetails"].forEach((doc) => {
			doc["mobile"] = this.commonUtilityService.formatMobileNumber(doc.mobile, phonePermission);
			doc["emailId"] = this.commonUtilityService.formatEmail(doc.emailId, emailPermission);
			doc["name"] = this.commonUtilityService.capitalizeWords(doc["name"]);
		});
		return refdoc;
	}

	async handlePaymentRequest(
		participant: LeaseParticipant,
		primaryUserInfo: UserMasterEntity,
		userid: number,
		refdocId: number,
		requestedUserProfileData: UserProfileProgress,
		mobileCode: string,
		userType: ParticipantUserType
	) {
		this.checkLeaseParticipantData(participant);
		let participantInfo: UserMasterEntity;
		if (participant?.inviteMethod === InviteMethodType.EMAIL) {
			if (primaryUserInfo?.emailId === participant?.invitationData) {
				throw new HttpException({ status: ResponseData.INVALID_EMAIL }, HttpStatus.OK);
			}
			const payeeInfo = await this.participantDaoService.getUserPaymentRequestDataByEmail(
				userid,
				refdocId,
				participant.invitationData
			);
			if (payeeInfo) {
				throw new HttpException({ status: ResponseData.INVITATION_ALREADY_SENT }, HttpStatus.OK);
			}
			participantInfo = await this.userDaoService.getUserInfoByEmailId(participant?.invitationData);
		} else {
			if (primaryUserInfo?.mobileNo === participant?.invitationData) {
				throw new HttpException({ status: ResponseData.INVALID_MOBILE_NO }, HttpStatus.OK);
			}
			const payeeInfo = await this.participantDaoService.getUserPaymentRequestDataByMobile(
				userid,
				refdocId,
				participant.invitationData
			);
			if (payeeInfo) {
				throw new HttpException({ status: ResponseData.INVITATION_ALREADY_SENT }, HttpStatus.OK);
			}
			participantInfo = await this.userDaoService.getUserInfoByMobile(mobileCode, participant?.invitationData);
		}
		let invitaionCode = await this.generateVerificationCode(6);
		let paymentUserMappingRequest = new PaymentUsersMappingRequest(
			userid,
			null,
			participant?.inviteMethod === InviteMethodType.EMAIL ? participant?.invitationData : null,
			participant?.inviteMethod === InviteMethodType.MOBILE ? participant?.invitationData : null,
			invitaionCode,
			0,
			refdocId
		);
		paymentUserMappingRequest.addPaymentUserDetails(
			ParticipantActionTypeEnum.ADD,
			userType === ParticipantUserType.PRIMARY ? RequestStatusEnum.VERIFICATION_PENDING : RequestStatusEnum.REQUESTED,
			participantInfo ? participantInfo?.userId : null,
			participant.name
		);
		if (participantInfo) {
			requestedUserProfileData = new UserProfileProgress(
				participantInfo?.userId,
				UserProfileStatusEnum.INVITED_PLAID_PENDING,
				JSON.stringify(paymentUserMappingRequest),
				refdocId
			);
		}
		return { paymentRequestData: paymentUserMappingRequest, requestedUserProfileData };
	}

	async handleParticipant(
		participant: LeaseParticipant,
		primaryUserInfo: UserMasterEntity,
		userid: number,
		refdocId: number,
		requestedUserProfileData: UserProfileProgress,
		mobileCode: string
	) {
		this.checkLeaseParticipantData(participant);
		let participantInfo: UserMasterEntity;
		if (participant?.inviteMethod === InviteMethodType.EMAIL) {
			if (primaryUserInfo?.emailId === participant?.invitationData) {
				throw new HttpException({ status: ResponseData.INVALID_EMAIL }, HttpStatus.OK);
			}
			const participantData = await this.participantDaoService.getUserRequestedParticipantDataByEmail(
				userid,
				participant.invitationData,
				refdocId
			);
			if (participantData) {
				throw new HttpException({ status: ResponseData.INVITATION_ALREADY_SENT }, HttpStatus.OK);
			}
			participantInfo = await this.userDaoService.getUserInfoByEmailId(participant?.invitationData);
		} else {
			if (primaryUserInfo?.mobileNo === participant?.invitationData) {
				throw new HttpException({ status: ResponseData.INVALID_MOBILE_NO }, HttpStatus.OK);
			}
			const participantData = await this.participantDaoService.getUserRequestedParticipantDataByMobile(
				userid,
				participant.invitationData,
				refdocId
			);
			if (participantData) {
				throw new HttpException({ status: ResponseData.INVITATION_ALREADY_SENT }, HttpStatus.OK);
			}
			participantInfo = await this.userDaoService.getUserInfoByMobile(mobileCode, participant?.invitationData);
		}
		let invitaionCode = await this.generateVerificationCode(6);
		let participantMapRequest = new ParticipantMapRequest(
			userid,
			participantInfo ? participantInfo.userId : null,
			participant?.name,
			participant?.inviteMethod === InviteMethodType.EMAIL ? participant?.invitationData : null,
			participant?.inviteMethod === InviteMethodType.MOBILE ? participant?.invitationData : null,
			invitaionCode,
			0
		);
		participantMapRequest.addParticiapntDetails(
			null,
			refdocId,
			null,
			ParticipantActionTypeEnum.ADD,
			RequestStatusEnum.VERIFICATION_PENDING
		);
		if (participantInfo) {
			requestedUserProfileData = new UserProfileProgress(
				participantInfo?.userId,
				UserProfileStatusEnum.INVITED_LEASE_DATA_PENDING,
				JSON.stringify(participantMapRequest),
				refdocId
			);
		}
		return { participantMappingRequest: participantMapRequest, requestedUserProfileData };
	}

	async checkRefdocValidity(leaseDataDto: RentDetailsDto, request: any) {
		let { refdocId, userType, leaseParticipants } = leaseDataDto;
		let { userid } = request.headers;
		if (userType === ParticipantUserType.PRIMARY) {
			return await this.docDaoService.getUserRefdocMasterData(userid, refdocId);
		}
		if (leaseParticipants.type === LeaseParticipantType.PARTICIPANT) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		await this.participantDaoService.getUserParticipantDataByParticipantAndRefdocId(
			refdocId,
			userid,
			RequestStatusEnum.REQUESTED
		);
	}

	getPaymentBy(isSelfPayee: boolean, haveOtherPayee: boolean) {
		let paymentBy: RentPaymentByEnum = RentPaymentByEnum.SELF;
		if (isSelfPayee && !haveOtherPayee) {
			paymentBy = RentPaymentByEnum.SELF;
		} else if (!isSelfPayee && haveOtherPayee) {
			paymentBy = RentPaymentByEnum.OTHER;
		} else if (isSelfPayee && haveOtherPayee) {
			paymentBy = RentPaymentByEnum.TOGETHER;
		}
		return paymentBy;
	}

	checkLeaseParticipantData(leaseParticipant: LeaseParticipant) {
		if (
			!leaseParticipant.invitationData ||
			!Object.keys(InviteMethodType).includes(leaseParticipant?.inviteMethod) ||
			!leaseParticipant.name ||
			!Object.keys(LeaseParticipantType).includes(leaseParticipant?.type)
		) {
			throw new HttpException({ status: ResponseData.INVALID_PARTICIPANT_DATA }, HttpStatus.OK);
		}
	}

	async updateUserProfileStatusByUserType(leaseDataDto: RentDetailsDto, userId: number, queryRunner: QueryRunner) {
		const { userType, refdocId, leaseParticipants } = leaseDataDto;
		const { type } = leaseParticipants;
		if (userType === ParticipantUserType.PRIMARY) {
			const userProfileStatus = await this.userDaoService.getUserProfileDataForRefdoc(userId, null);
			if (userProfileStatus) {
				const currentData = JSON.parse(userProfileStatus.data);
				const newProfileStatus = this.getNewStatusAfterPaymentDetails(currentData, type, userType);
				if (newProfileStatus != UserProfileStatusEnum.PAYMENT_DETAIL_PENDING) {
					await this.updateRefdocStatusForComplete(refdocId, userId, queryRunner);
				}
				return await this.commonUtilityService.updateUserProfileStatus(
					userId,
					UserProfileStatusEnum.PAYMENT_DETAIL_PENDING,
					newProfileStatus,
					JSON.stringify(currentData),
					null,
					queryRunner,
					userProfileStatus
				);
			}
		}
		const userProfileStatus = await this.userDaoService.getUserProfileDataForRefdoc(userId, refdocId);
		const currentData = JSON.parse(userProfileStatus.data);
		const newProfileStatus = this.getNewStatusAfterPaymentDetails(currentData, type, userType);
		if (newProfileStatus != UserProfileStatusEnum.PAYMENT_DETAIL_PENDING && userType === ParticipantUserType.PRIMARY) {
			await this.updateRefdocStatusForComplete(refdocId, userId, queryRunner);
		}
		await this.commonUtilityService.updateUserProfileStatus(
			userId,
			UserProfileStatusEnum.PAYMENT_DETAIL_PENDING,
			newProfileStatus,
			JSON.stringify(currentData),
			refdocId,
			queryRunner
		);
	}

	getNewStatusAfterPaymentDetails(data, type: LeaseParticipantType, userType: ParticipantUserType) {
		let rentDetails = data.rentDetails;
		if (!rentDetails) {
			return UserProfileStatusEnum.HOME;
		}
		rentDetails[type] = RentDetailsStatusEnum.DONE;
		data.rentDetails = rentDetails;
		if (
			rentDetails.PAYMENT_REQUEST === RentDetailsStatusEnum.PENDING ||
			rentDetails.PARTICIPANT === RentDetailsStatusEnum.PENDING
		) {
			return UserProfileStatusEnum.PAYMENT_DETAIL_PENDING;
		} else if (rentDetails.SELF === RentDetailsStatusEnum.PENDING) {
			return userType === ParticipantUserType.PRIMARY
				? UserProfileStatusEnum.PLAID_PENDING
				: UserProfileStatusEnum.INVITED_PLAID_PENDING;
		}
		return UserProfileStatusEnum.HOME;
	}

	async updateUserProfileStatusForRentDetails(
		saveRentPaymentDetails: SaveRentPaymentDetails,
		userId: number,
		queryRunner: QueryRunner
	) {
		const { refdocId, self, participant, paymentRequest, isPrimaryUser } = saveRentPaymentDetails;
		const rentDetails = {
			SELF: self === YesNoEnum.YES ? RentDetailsStatusEnum.PENDING : RentDetailsStatusEnum.NOT_SELECTED,
			PAYMENT_REQUEST:
				paymentRequest === YesNoEnum.YES ? RentDetailsStatusEnum.PENDING : RentDetailsStatusEnum.NOT_SELECTED,
			PARTICIPANT: participant === YesNoEnum.YES ? RentDetailsStatusEnum.PENDING : RentDetailsStatusEnum.NOT_SELECTED
		};
		const data = {
			refdocId: refdocId,
			rentDetails
		};
		const newProfileStatus = this.getNewProfileStatusAfterRentDetails(saveRentPaymentDetails);
		if (isPrimaryUser === YesNoEnum.YES) {
			const userProfileStatus = await this.userDaoService.getUserProfileDataForRefdoc(userId, null);
			if (userProfileStatus) {
				return await this.commonUtilityService.updateUserProfileStatus(
					userId,
					UserProfileStatusEnum.LEASE_DATA_PENDING,
					newProfileStatus,
					JSON.stringify(data),
					null,
					queryRunner,
					userProfileStatus
				);
			}
		}
		await this.commonUtilityService.updateUserProfileStatus(
			userId,
			isPrimaryUser === YesNoEnum.YES
				? UserProfileStatusEnum.LEASE_DATA_PENDING
				: UserProfileStatusEnum.INVITED_LEASE_DATA_PENDING,
			newProfileStatus,
			JSON.stringify(data),
			refdocId,
			queryRunner
		);
	}

	getNewProfileStatusAfterRentDetails(saveRentPaymentDetails: SaveRentPaymentDetails) {
		const { self, participant, paymentRequest, isPrimaryUser } = saveRentPaymentDetails;
		if (self === YesNoEnum.YES && paymentRequest === YesNoEnum.NO && participant === YesNoEnum.NO) {
			return isPrimaryUser === YesNoEnum.YES
				? UserProfileStatusEnum.PLAID_PENDING
				: UserProfileStatusEnum.INVITED_PLAID_PENDING;
		} else {
			return UserProfileStatusEnum.PAYMENT_DETAIL_PENDING;
		}
	}

	async checkValidationDocMasterProofDto(saveMasterProofDto: SaveMasterProofDto, file: MemoryStorageFile) {
		let { masterProofType, paymentType, refdocId, isOtherPayee, plaidTokenId, description } = saveMasterProofDto;
		if (
			!masterProofType ||
			!Object.keys(MasterProofTypeEnum).includes(masterProofType) ||
			!refdocId ||
			!isOtherPayee ||
			!Object.keys(YesNoEnum).includes(isOtherPayee)
		) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		let isValidPayment = await this.packageDaoService.getPaymentTypeDetails(paymentType, masterProofType);
		if (!isValidPayment) {
			throw new HttpException({ status: ResponseData.INVALID_PAYMENT_TYPE }, HttpStatus.OK);
		}
		if (masterProofType === MasterProofTypeEnum.PLAID && !plaidTokenId) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		if (masterProofType === MasterProofTypeEnum.AGREEMENT && !file?.buffer?.buffer?.byteLength) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		if (masterProofType === MasterProofTypeEnum.DESCRIPTION && !description) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
	}

	async savePlaidValidationDocAsMasterProof(
		saveMasterProofDto: SaveMasterProofDto,
		request: any,
		benificiaryUserId: number,
		queryRunner: QueryRunner
	) {
		let { channelId } = request.headers;
		const userId = request.headers.userid;
		let { refdocId, paymentType, plaidTokenId } = saveMasterProofDto;
		let payeePlaidTokenDetails = await this.plaidDaoService.getUserLinkTokenDetailsByTokenId(
			userId,
			refdocId,
			paymentType,
			plaidTokenId
		);
		if (!payeePlaidTokenDetails?.accessToken) {
			throw new HttpException({ status: ResponseData.NO_PLAID_TOKEN_FOUND }, HttpStatus.OK);
		}
		let accessToken = payeePlaidTokenDetails.accessToken;
		let plaidAccountIdDataJson = await this.plaidService.getPlaidAccountDetailsFromAccessToken(accessToken);
		let accountIds: string[] = Object.keys(plaidAccountIdDataJson);
		const configMap = await this.configurationService.getChannelConfigurations(channelId);
		let verifiedBy = +configMap.get("SCRIPT_USER_ID");
		let proofUrl = null;
		const plaidObj = { plaidTokenId: plaidTokenId, proofUrl: proofUrl, paymentType: paymentType };
		const refdocAndPayeeIdObj = { refdocId, payeeId: userId };
		await this.plaidService.insertValidationProofPlaidAccountIds(
			accountIds,
			benificiaryUserId,
			plaidAccountIdDataJson,
			verifiedBy,
			refdocAndPayeeIdObj,
			plaidObj,
			queryRunner
		);
		const paymentScheduleArr = await this.docDaoService.getPaymentScheduleDataByRefdocId(refdocId);
		if (paymentScheduleArr.length) {
			await this.updatePaymentscheduleAndPlaidMonthlyProof(refdocId, userId, paymentScheduleArr, null, queryRunner);
		}
	}

	async saveMasterProofAgreementData(
		saveMasterProofDto: SaveMasterProofDto,
		request: any,
		benificiaryUserId: number,
		file: MemoryStorageFile,
		queryRunner: QueryRunner
	) {
		let { businessId } = request.headers;
		const userId = request.headers.userid;
		let { refdocId, paymentType, masterProofType } = saveMasterProofDto;
		let docData = await this.commonUtilityService.uploadImageToS3(file, businessId);
		let proofUrl = docData?.url;
		let validationDocMasterProofData = new ValidationDocMasterProof(
			benificiaryUserId,
			userId,
			refdocId,
			masterProofType,
			paymentType,
			ProofStatus.REQUESTED
		);
		validationDocMasterProofData.updateProofDetails(null, proofUrl, null);
		await this.docDaoService.saveValidationDocMasterDataByQueryRunner(validationDocMasterProofData, queryRunner);
	}

	async saveMonthlyRequiredMasterProofData(
		saveMasterProofDto: SaveMasterProofDto,
		request: any,
		benificiaryUserId: number,
		queryRunner: QueryRunner
	) {
		let { businessId } = request.headers;
		let { refdocId, paymentType, masterProofType } = saveMasterProofDto;
		const userId = request.headers.userid;
		const configMap = await this.configurationService.getAllB2BBusinessConfigurations(businessId);
		const verifiedBy = configMap.get("SCRIPT_USER_ID") ? +configMap.get("SCRIPT_USER_ID") : 0;
		let validationDocMasterProofData = new ValidationDocMasterProof(
			benificiaryUserId,
			userId,
			refdocId,
			masterProofType,
			paymentType,
			ProofStatus.APPROVED
		);
		validationDocMasterProofData.updateVerifingDetails(verifiedBy);
		await this.docDaoService.saveValidationDocMasterDataByQueryRunner(validationDocMasterProofData, queryRunner);
	}

	async saveDescriptionMasterProofData(
		saveMasterProofDto: SaveMasterProofDto,
		request: any,
		benificiaryUserId: number,
		file: MemoryStorageFile,
		queryRunner: QueryRunner
	) {
		let { businessId } = request.headers;
		const userId = request.headers.userid;
		let { refdocId, paymentType, masterProofType, description } = saveMasterProofDto;
		let proofUrl = null;
		if (file?.buffer?.buffer?.byteLength) {
			let docData = await this.commonUtilityService.uploadImageToS3(file, businessId);
			proofUrl = docData?.url;
		}
		let validationDocMasterProofData = new ValidationDocMasterProof(
			benificiaryUserId,
			userId,
			refdocId,
			masterProofType,
			paymentType,
			ProofStatus.REQUESTED
		);
		validationDocMasterProofData.updateProofDetails(null, proofUrl, JSON.stringify({ description }));
		await this.docDaoService.saveValidationDocMasterDataByQueryRunner(validationDocMasterProofData, queryRunner);
	}

	async validatePayeeRequest(saveMasterProofDto: SaveMasterProofDto, request: any) {
		let { businessId, channelId, userid } = request.headers;
		let benificiarySystemUserId = saveMasterProofDto.benificiaryUserId;
		let { refdocId } = saveMasterProofDto;
		let benificiaryUserId = await this.userDaoService.getUserIdFromSystemUserId(
			businessId,
			channelId,
			benificiarySystemUserId.toString(),
			UserType.CONSUMER
		);
		if (!benificiaryUserId) {
			throw new HttpException({ status: ResponseData.INVALID_USER_FOUND }, HttpStatus.OK);
		}
		await this.participantDaoService.getInvitedUserPaymentRequestDataByPayeeUser(benificiaryUserId, refdocId, userid);
		return benificiaryUserId;
	}

	async updateUserRefdocProfileStatusAfterMasterProof(
		isOtherPayee: YesNoEnum,
		userId: number,
		refdocId: number,
		queryRunner: QueryRunner
	) {
		const newProfileStatus: UserProfileStatusEnum = UserProfileStatusEnum.HOME;
		if (isOtherPayee === YesNoEnum.NO) {
			const userProfileStatus = await this.userDaoService.getUserProfileDataForRefdoc(userId, null);
			if (userProfileStatus) {
				const data = JSON.parse(userProfileStatus.data);
				if (data?.rentDetails) {
					data.rentDetails["SELF"] = RentDetailsStatusEnum.DONE;
				}
				return await this.commonUtilityService.updateUserProfileStatus(
					userId,
					UserProfileStatusEnum.PLAID_PENDING,
					newProfileStatus,
					JSON.stringify(data),
					refdocId,
					queryRunner,
					userProfileStatus
				);
			}
		}
		let userProfileStatus = await this.userDaoService.getUserProfileDataForRefdoc(userId, refdocId);
		const data = JSON.parse(userProfileStatus.data);
		if (data?.rentDetails) {
			data.rentDetails["SELF"] = RentDetailsStatusEnum.DONE;
		}
		await this.commonUtilityService.updateUserProfileStatus(
			userId,
			userProfileStatus?.profileStageCode,
			newProfileStatus,
			JSON.stringify(data),
			refdocId,
			queryRunner
		);
	}

	async getRefdocStatusByIds(
		selfRefdocIds: number[],
		participantRefdocIds: number[],
		payeeRefdocIds: number[],
		userId: number
	) {
		const refdocIds = [...selfRefdocIds, ...participantRefdocIds, ...payeeRefdocIds];
		const refdocs = await this.docDaoService.getRefdocDataByRefdocIds(refdocIds);
		const refdocIdToStatusMapping = {};
		if (!refdocs.length) {
			throw new HttpException({ status: ResponseData.REFDOC_NOT_FOUND }, HttpStatus.OK);
		}
		const refdocIdToRefdocMapping = {};
		refdocs.forEach((refdoc) => (refdocIdToRefdocMapping[refdoc.refdocId] = refdoc));
		const masterProofs = await this.docDaoService.getMasterProofsByRefdocIds(refdocIds);
		const masterProofIds = masterProofs.map((masterProof) => masterProof.id);
		const monthlyProofs = await this.monthlyDocDaoService.getMonthlyProofByMasterProofIds(masterProofIds);

		[...selfRefdocIds, ...participantRefdocIds].forEach((refdocId) => {
			this.setRefdocOverallStatus(
				refdocIdToRefdocMapping,
				refdocId,
				refdocIdToStatusMapping,
				masterProofs,
				monthlyProofs,
				userId
			);
		});
		payeeRefdocIds.forEach((refdocId) => {
			this.setRefdocOverallStatus(
				refdocIdToRefdocMapping,
				refdocId,
				refdocIdToStatusMapping,
				masterProofs,
				monthlyProofs,
				userId,
				true
			);
		});
		return refdocIdToStatusMapping;
	}

	setRefdocOverallStatus(
		refdocIdToRefdocMapping,
		refdocId: number,
		refdocIdToStatusMapping,
		masterProofs: ValidationDocMasterProof[],
		monthlyProofs: ValidationDocMonthlyProof[],
		userId: number,
		isPayee = false
	) {
		const selfRefdoc = refdocIdToRefdocMapping[refdocId];
		if (selfRefdoc.status !== RefdocMasterStatusEnum.APPROVED) {
			refdocIdToStatusMapping[refdocId] = selfRefdoc.status.toString();
			return;
		}
		const selfMasterProof = this.getMasterProofByPayeeAndRefdocFromMasterProofData(
			masterProofs,
			userId,
			refdocId,
			isPayee
		);
		if (!selfMasterProof.length) {
			refdocIdToStatusMapping[refdocId] = RefdocOverallStatusEnum.PAYMENT_OPTIONS_UPLOAD_PENDING;
			return;
		}
		const masterProofIds = [];
		const approvedMasterProofs = selfMasterProof.filter((masterProof) => {
			masterProofIds.push(masterProof.id);
			return masterProof.status === ProofStatus.APPROVED;
		});
		if (!approvedMasterProofs.length) {
			refdocIdToStatusMapping[refdocId] = RefdocOverallStatusEnum.PAYMENT_OPTIONS_APPROVAL_PENDING;
			return;
		}
		const selfMonthlyProofs = this.getMonthlyProofByMasterProofIdsFromMonthlyProofData(monthlyProofs, masterProofIds);
		let isMonthlyProofUploadPending = false;
		let isMonthlyProofApprovalPending = false;
		selfMonthlyProofs.forEach((monthlyProof) => {
			if (monthlyProof.status === MonthlyProofStatusEnum.UPLOAD_PENDING) {
				isMonthlyProofUploadPending = true;
			} else if (monthlyProof.status === MonthlyProofStatusEnum.REQUESTED) {
				isMonthlyProofApprovalPending = true;
			}
		});
		if (isMonthlyProofUploadPending) {
			refdocIdToStatusMapping[refdocId] = RefdocOverallStatusEnum.MONTHLY_PROOFS_UPLOAD_PENDING;
			return;
		}
		if (isMonthlyProofApprovalPending) {
			refdocIdToStatusMapping[refdocId] = RefdocOverallStatusEnum.MONTHLY_PROOFS_APPROVAL_PENDING;
			return;
		}
		refdocIdToStatusMapping[refdocId] = RefdocOverallStatusEnum.APPROVED;
	}

	getMonthlyProofByMasterProofIdsFromMonthlyProofData(
		monthlyProofs: ValidationDocMonthlyProof[],
		masterProofIds: number[]
	) {
		return monthlyProofs.filter((monthlyProof) => masterProofIds.includes(monthlyProof.masterProofId));
	}

	getMasterProofByPayeeAndRefdocFromMasterProofData(
		masterProofs: ValidationDocMasterProof[],
		userId: number,
		refdocId: number,
		isPayee = false
	) {
		return isPayee
			? masterProofs.filter((masterProof) => {
					return masterProof.payeeId == userId && masterProof.refdocId == refdocId;
			  })
			: masterProofs.filter((masterProof) => {
					return masterProof.userId == userId && masterProof.refdocId == refdocId;
			  });
	}

	async addProfileProgressData(requestedUserProfileData: UserProfileProgress[]) {
		if (requestedUserProfileData.length) {
			await this.userDaoService.addMultipleUserProfileData(requestedUserProfileData);
		}
	}

	getMasterProofDetails(masterProofFullDetail: any) {
		let {
			masterProofId,
			masterProofStatus,
			masterProofType,
			masterProofValidTill,
			paymentType,
			proofDetail,
			proofIdValue,
			proofPath,
			userEmail,
			userFirstName,
			userLastName,
			userMobileNumber,
			username
		} = masterProofFullDetail;
		return {
			masterProofId,
			masterProofStatus,
			masterProofType,
			masterProofValidTill,
			paymentType,
			proofDetail,
			proofIdValue,
			proofPath,
			userEmail,
			userFirstName,
			userLastName,
			userMobileNumber,
			username
		};
	}

	async getPaymentScheduleWithDisputes(
		refdocId: number,
		monthLastDate: string,
		userId: number,
		dateFormat: string,
		benificiaryUserId: number
	) {
		const paymentSchedule = await this.docDaoService.getOlderPaymentSchedule(refdocId, monthLastDate, benificiaryUserId);
		const monthYearDisputeMapping: Map<string, any[]> = new Map();
		const monthYearMonthlyProofMapping: Map<string, any[]> = new Map();
		const disputes = await this.disputeDaoService.getDisputeDataByRefdocIdAndRaisedById(userId, refdocId);
		disputes.forEach((dispute) => {
			const monthYear = dispute.reportingMonth + "-" + dispute.reportingYear;
			if (!monthYearDisputeMapping.has(monthYear)) {
				monthYearDisputeMapping.set(monthYear, []);
			}
			monthYearDisputeMapping.set(monthYear, [...monthYearDisputeMapping.get(monthYear), dispute]);
		});
		const monthlyProofIds = await this.commonUtilityService.getMonthlyProofIdsForReuploadedStatus(
			MonthlyProofStatusEnum.REUPLOADED
		);
		const monthlyProofs = await this.monthlyDocDaoService.getMonthlyProofsOfPayeeByRefdocId(
			userId,
			refdocId,
			monthlyProofIds
		);
		monthlyProofs.forEach((monthlyProof) => {
			const monthYear = monthlyProof.reportingMonth + "-" + monthlyProof.reportingYear;
			if (!monthYearMonthlyProofMapping.has(monthYear)) {
				monthYearMonthlyProofMapping.set(monthYear, []);
			}
			if (
				monthlyProof.monthlyProofType === MonthlyProofTypeEnum.TRANSACTION &&
				monthlyProof.monthlyProofStatus != MonthlyProofStatusEnum.APPROVED
			) {
				return;
			}
			monthYearMonthlyProofMapping.set(monthYear, [...monthYearMonthlyProofMapping.get(monthYear), monthlyProof]);
		});
		for (const schedule of paymentSchedule) {
			if (schedule[VariablesConstant.MODIFIED_AMOUNT]) {
				schedule["amount"] = schedule[VariablesConstant.MODIFIED_AMOUNT];
			}
			const dueDate = MonthMapEnum[schedule.dueDate.getMonth() + 1] + "-" + schedule.dueDate.getFullYear();
			schedule["disputes"] = monthYearDisputeMapping.has(dueDate)
				? monthYearDisputeMapping.get(dueDate).map((dispute) => {
						dispute.disputeCreatedAt = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
							dispute.disputeCreatedAt,
							dateFormat
						);
						dispute.disputeLastUpdatedAt = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
							dispute.disputeLastUpdatedAt,
							dateFormat
						);
						return dispute;
				  })
				: [];
			schedule["monthlyProofs"] = monthYearMonthlyProofMapping.has(dueDate)
				? await this.getApprovedMonthlyProofs(monthYearMonthlyProofMapping, dueDate, dateFormat)
				: [];
		}
		return paymentSchedule;
	}

	async getApprovedMonthlyProofs(monthYearMonthlyProofMapping, dueDate, dateFormat) {
		const monthlyProofs = monthYearMonthlyProofMapping.get(dueDate);
		const approvedMonthlyProofs = [];
		for (const monthlyProof of monthlyProofs) {
			monthlyProof.createdAt = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				monthlyProof.createdAt,
				dateFormat
			);
			monthlyProof.verifiedAt = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				monthlyProof.verifiedAt,
				dateFormat
			);
			monthlyProof.updatedAt = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				monthlyProof.updatedAt,
				dateFormat
			);
			if (monthlyProof.proofPath) {
				monthlyProof.proofPath = JSON.parse(monthlyProof.proofPath);
			}
			if (monthlyProof.receipt) {
				const receiptObjArr = JSON.parse(monthlyProof.receipt);
				receiptObjArr.forEach((receiptObj) => {
					monthlyProof.receipt = [receiptObj["receiptUrl"]];
				});
			}
			if (monthlyProof.proofDetail) {
				monthlyProof.proofDetail = JSON.parse(monthlyProof.proofDetail);
			}
			if (monthlyProof.fiRefNo) {
				monthlyProof.fiRefNo = JSON.parse(monthlyProof.fiRefNo);
			}
			if (monthlyProof.monthlyProofType === MonthlyProofTypeEnum.TRANSACTION) {
				const verifiedMonthlyProofs = await this.monthlyDocDaoService.getVerifiedProofsByMasterProofMonthAndYear(
					monthlyProof.masterProofId,
					monthlyProof.reportingMonth,
					monthlyProof.reportingYear
				);
				const approvedDetails = [];
				verifiedMonthlyProofs?.forEach((proof) => {
					const details = {
						transactionId: proof.fiRefNo,
						authorizedDate: this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
							proof.transactionDate,
							dateFormat
						),
						amount: Math.abs(proof.approvedAmount)
					};
					approvedDetails.push(details);
				});
				monthlyProof.proofDetail = { transactionDetails: approvedDetails };
			}
			approvedMonthlyProofs.push(monthlyProof);
		}
		return approvedMonthlyProofs;
	}

	async sendUserEvent(
		userInfo: UserMasterEntity,
		refdocType: string,
		eventType: KafkaEventTypeEnum,
		aliasName: string,
		docType: string,
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
		const params: LeaseEventParams = {
			firstName: userInfo.firstName,
			lastName: userInfo.lastName,
			docType: docType,
			refdocType: refdocType
		};
		const inboxDeepLinkParams: InboxDeepLinkParams = {
			screenName,
			screenReferenceId
		};
		kafkaEventMessageDto.addParmas(params);
		kafkaEventMessageDto.addInboxDeepLinkParams(inboxDeepLinkParams);
		await this.notificationProducerService.InviteParticipant(kafkaEventMessageDto, eventType);
	}

	async sendMonthlyProofUploadEvent(
		refdocTypeId: number,
		payeeId: number,
		proofType: string,
		aliasName: string,
		screenReferenceId: number
	) {
		const userInfo = await this.userDaoService.getUserInfoByUserId(payeeId);
		const refdocType = await this.docDaoService.getRefDocTypeById(refdocTypeId);
		const kafkaEventMessageDto = new KafkaEventMessageDto(
			aliasName,
			userInfo.currencyCode,
			userInfo.mobileVerified == YNStatusEnum.YES ? userInfo.mobileCode + userInfo.mobileNo : null,
			userInfo.emailVerified == YNStatusEnum.YES ? userInfo.emailId : null,
			userInfo.userType
		);
		kafkaEventMessageDto.addDetails(+userInfo.systemUserId, userInfo.businessId);
		const params: MonthlyProofDueEventParams = {
			firstName: userInfo.firstName,
			lastName: userInfo.lastName,
			docType: refdocType.name,
			proofType: proofType
		};

		const inboxDeepLinkParams: InboxDeepLinkParams = {
			screenName: ScreenNames.MONTHLY_PROOF_SCREEN_NAME,
			screenReferenceId
		};
		kafkaEventMessageDto.addParmas(params);
		kafkaEventMessageDto.addInboxDeepLinkParams(inboxDeepLinkParams);
		this.notificationProducerService.InviteParticipant(kafkaEventMessageDto, KafkaEventTypeEnum.UPLOAD_DUE);
	}

	async getUserMasterProofsForRefdoc(refdocId: number, userId: number, dateFormat: string) {
		const masterProofData = await this.docDaoService.getMasterProofData(refdocId, userId);
		masterProofData.forEach((masterProof) => {
			masterProof["proofDetail"] = JSON.parse(masterProof["proofDetail"]);
			if (masterProof.masterProofType === MasterProofTypeEnum.PLAID) {
				masterProof["proofDetail"] = { accountNo: "****-****-" + masterProof?.proofDetail?.account.slice(-4) };
			}
			masterProof["createdAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				masterProof["createdAt"],
				dateFormat
			);
		});
		return masterProofData;
	}

	async updateDateFormatForRefdocFullData(
		configs: Map<string, string>,
		refdocData,
		currencyFormattingData: Object,
		piiPermissions
	) {
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT) || "MM-DD-YYYY";
		const { ssnPermission } = piiPermissions;
		refdocData["formattedRentAmount"] = this.commonUtilityService.formatCurrency(
			currencyFormattingData,
			refdocData["rentAmount"]
		);
		refdocData["formattedBaseAmount"] = this.commonUtilityService.formatCurrency(
			currencyFormattingData,
			refdocData["baseAmount"]
		);
		refdocData["validFrom"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			refdocData["validFrom"],
			dateFormat
		);
		refdocData["validTo"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			refdocData["validTo"],
			dateFormat
		);
		refdocData["paymentSchedule"].dueDate = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			refdocData["paymentSchedule"].dueDate,
			dateFormat
		);
		refdocData["paymentSchedule"].paymentDueDate = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			refdocData["paymentSchedule"].paymentDueDate,
			dateFormat
		);
		refdocData.masterProofs.forEach((masterProof) => {
			masterProof["createdAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				masterProof["createdAt"],
				dateFormat
			);
			masterProof["verifiedAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				masterProof["verifiedAt"],
				dateFormat
			);
		});
		refdocData.disputeData.forEach((dispute) => {
			dispute["disputeCreatedAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				dispute["disputeCreatedAt"],
				dateFormat
			);
		});
		refdocData["formattedUserMobileNumber"] = this.commonUtilityService.formatMobileNumber(
			refdocData["userMobileNumber"]
		);
		const extraDetailsFormattingReq = [
			"securityDespositAmount",
			"proratedRentAmount",
			"monthlyBaseRentAmount",
			"animalViolationChargeAmount",
			"payFailureFeeAmount"
		];
		refdocData["extraDetails"].forEach((extraDetail) => {
			if (extraDetailsFormattingReq.includes(extraDetail.key)) {
				extraDetail["formattedValue"] = this.commonUtilityService.formatCurrency(
					currencyFormattingData,
					extraDetail.value
				);
			}
		});
		refdocData["firstName"] = refdocData["firstName"]
			? this.commonUtilityService.capitalizeWords(refdocData["firstName"])
			: this.commonUtilityService.capitalizeWords(refdocData["userFirstName"]);
		refdocData["lastName"] = refdocData["lastName"]
			? this.commonUtilityService.capitalizeWords(refdocData["lastName"])
			: this.commonUtilityService.capitalizeWords(refdocData["userLastName"]);
		refdocData["middleName"] = refdocData["middleName"]
			? this.commonUtilityService.capitalizeWords(refdocData["middleName"])
			: this.commonUtilityService.capitalizeWords(refdocData["userMiddleName"]);
		refdocData["suffixName"] = refdocData["suffixName"]
			? this.commonUtilityService.capitalizeWords(refdocData["suffixName"])
			: this.commonUtilityService.capitalizeWords(refdocData["userSuffixName"]);
		refdocData["userFirstName"] = this.commonUtilityService.capitalizeWords(refdocData["userFirstName"]);
		refdocData["userLastName"] = this.commonUtilityService.capitalizeWords(refdocData["userLastName"]);
		refdocData["userMiddleName"] = this.commonUtilityService.capitalizeWords(refdocData["userMiddleName"]);
		refdocData["userSuffixName"] = this.commonUtilityService.capitalizeWords(refdocData["userSuffixName"]);
		refdocData["ssnId"] = this.commonUtilityService.formatSsn(refdocData["ssnId"], ssnPermission);
		const stateCodeToNameMapping = await this.commonUtilityService.getStateCodeToNameMapping();
		refdocData["cityName"] = refdocData["city"];
		refdocData["stateName"] = stateCodeToNameMapping[refdocData["state"]];
		refdocData["remark"] = JSON.parse(refdocData["remark"]);
		refdocData["ownerName"] = this.commonUtilityService.capitalizeWords(refdocData["ownerName"]);
		refdocData["propertyName"] = this.commonUtilityService.capitalizeWords(refdocData["propertyName"]);
	}

	async getPaymentScheduleWithAmountAppoved(refdocId: number, currencyFormattingData: Object) {
		const paymentSchedule = await this.docDaoService.getPaymentScheduleByRefdocId(refdocId);
		const scheduleDataWithAmount = {};
		const yearArr = [];
		const monthArr = [];
		for (let schedule of paymentSchedule) {
			const { month, year } = this.commonUtilityService.getMonthAndYearFromDate(schedule.dueDate);
			const monthName = MonthMapEnum[month.toString()];
			if (!yearArr.includes(year)) {
				yearArr.push(year);
			}
			if (!monthArr.includes(monthName)) {
				monthArr.push(monthName);
			}
			schedule["amountInfo"] = [];
			schedule["totalAmountApproved"] = 0;
			schedule["pendingManualPayments"] = "0";
			scheduleDataWithAmount[`${monthName}-${year}`] = schedule;
		}
		if (monthArr.length) {
			await this.addAmountDataAndPendingManualPayments(refdocId, monthArr, yearArr, scheduleDataWithAmount);
		}
		this.formatScheduleData(scheduleDataWithAmount, currencyFormattingData);
		return Object.values(scheduleDataWithAmount);
	}

	async addAmountDataAndPendingManualPayments(refdocId, monthArr, yearArr, scheduleDataWithAmount) {
		const amountForSchedule = await this.docDaoService.getAmountApprovedByrefdocId(refdocId, monthArr, yearArr);
		const pendingManualPayments = await this.monthlyDocDaoService.getPendingManualPayments(refdocId, monthArr, yearArr);

		for (let data of amountForSchedule) {
			if (data.monthlyProofDoc) {
				data.monthlyProofDoc = JSON.parse(data.monthlyProofDoc);
			}
			const reportingDateKey = `${data.reportingMonth}-${data.reportingYear}`;
			if (scheduleDataWithAmount[reportingDateKey]) {
				scheduleDataWithAmount[reportingDateKey]["amountInfo"].push(data);
				scheduleDataWithAmount[reportingDateKey]["totalAmountApproved"] += data.amount;
			}
		}

		if (pendingManualPayments.length) {
			pendingManualPayments.forEach((data) => {
				const reportingDateKey = `${data.reportingMonth}-${data.reportingYear}`;
				if (scheduleDataWithAmount[reportingDateKey]) {
					scheduleDataWithAmount[reportingDateKey]["pendingManualPayments"] = data.pendingManualPayments;
				}
			});
		}
	}

	formatScheduleData(scheduleDataWithAmount, currencyFormattingData) {
		for (let schedule of Object.values(scheduleDataWithAmount)) {
			if (!schedule[VariablesConstant.MODIFIED_AMOUNT] || schedule[VariablesConstant.MODIFIED_AMOUNT] == 0) {
				schedule[VariablesConstant.MODIFIED_AMOUNT] = schedule["amount"];
			}
			schedule["formattedAmount"] = this.commonUtilityService.formatCurrency(
				currencyFormattingData,
				schedule["amount"]
			);
			if (!schedule[VariablesConstant.MODIFIED_AMOUNT] || schedule[VariablesConstant.MODIFIED_AMOUNT] == 0) {
				schedule[VariablesConstant.MODIFIED_AMOUNT] = schedule["amount"];
			}
			schedule["formattedModifiedAmount"] = this.commonUtilityService.formatCurrency(
				currencyFormattingData,
				schedule[VariablesConstant.MODIFIED_AMOUNT]
			);
			schedule["formattedTotalAmountApproved"] = this.commonUtilityService.formatCurrency(
				currencyFormattingData,
				schedule["totalAmountApproved"]
			);
			schedule["amountInfo"]?.forEach((rentDetail) => {
				rentDetail["formattedAmount"] = this.commonUtilityService.formatCurrency(
					currencyFormattingData,
					rentDetail["amount"]
				);
			});
		}
	}

	async saveRefdocHistoryData(refdoc: RefdocMaster) {
		const refdocHistory: RefdocHistory = new RefdocHistory(refdoc);
		await this.docDaoService.saveRefdocHistoryData(refdocHistory);
	}

	async saveRefdocHistoryDataByQueryRunner(refdoc: RefdocMaster, queryRunner: QueryRunner) {
		const refdocHistory: RefdocHistory = new RefdocHistory(refdoc);
		await this.docDaoService.saveRefdocHistoryDataByQueryRunner(refdocHistory, queryRunner);
	}

	async getRefdocHistoryData(refdocId: number, dateFormat: string) {
		const historyData = await this.docDaoService.getRefdocHistoryData(refdocId);
		const refdocWiseHistoryArr = [];
		let refdocHistoryArr = [];
		let refdocWiseHistoryObj = {};

		historyData.forEach((data) => {
			data["verifiedAt-timestamp"] = this.commonUtilityService.convertDateInToTimestamp(data["verifiedAt"]);
			data["verifiedAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data["verifiedAt"],
				dateFormat
			);
			data["updatedAt-timestamp"] = this.commonUtilityService.convertDateInToTimestamp(data["updatedAt"]);
			data["updatedAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data["updatedAt"],
				dateFormat
			);
			data["uploadedDate-timestamp"] = this.commonUtilityService.convertDateInToTimestamp(data["uploadedDate"]);
			data["uploadedDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data["uploadedDate"],
				dateFormat
			);
			data["approvedDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data["approvedDate"],
				dateFormat
			);
			data["verifiedBy"] = this.commonUtilityService.capitalizeWords(data["verifiedBy"]);
			data["validFrom-timestamp"] = this.commonUtilityService.convertDateInToTimestamp(data["validFrom"]);
			data["validFrom"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data["validFrom"],
				dateFormat
			);
			data["validTo-timestamp"] = this.commonUtilityService.convertDateInToTimestamp(data["validTo"]);
			data["validTo"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(data["validTo"], dateFormat);
			data["rentDueDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data["rentDueDate"],
				dateFormat
			);
			data["rentPaymentDueDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data["rentPaymentDueDate"],
				dateFormat
			);
			if (data["rejectionCount"] > 0 && data["status"] == RefdocMasterStatusEnum.REQUESTED) {
				data["status"] = RefdocMasterStatusEnum.REUPLOADED;
				data["historyStatusDesc"] = "Reuploaded";
			} else if (data["rejectionCount"] === 0 && data["status"] == RefdocMasterStatusEnum.REQUESTED) {
				data["status"] = RefdocMasterStatusEnum.NEWLY_UPLOADED;
				data["historyStatusDesc"] = "Newly Uploaded";
			}

			refdocHistoryArr.push(data);
			if (data.status === RefdocMasterStatusEnum.REJECTED) {
				refdocWiseHistoryObj["status"] = data.status;
				refdocWiseHistoryObj["documentPath"] = data.documentPath;
				refdocWiseHistoryObj["historyId"] = data.historyId;
				refdocWiseHistoryObj["historyStatusDesc"] = data.historyStatusDesc;
				refdocWiseHistoryObj["uploadedDate"] = data.uploadedDate;
				refdocWiseHistoryObj["uploadedDate-timestamp"] = data["uploadedDate-timestamp"];
				refdocWiseHistoryObj["verifiedBy"] = data.verifiedBy;
				refdocWiseHistoryObj["verifiedAt"] = data.verifiedAt;
				refdocWiseHistoryObj["verifiedAt-timestamp"] = data["verifiedAt-timestamp"];
				refdocWiseHistoryObj["updatedAt"] = data.updatedAt;
				refdocWiseHistoryObj["updatedAt-timestamp"] = data["updatedAt-timestamp"];
				refdocWiseHistoryObj["refdocHistory"] = refdocHistoryArr;
				refdocWiseHistoryArr.push(refdocWiseHistoryObj);
				refdocHistoryArr = [];
				refdocWiseHistoryObj = {};
			}
		});

		if (refdocHistoryArr.length) {
			const refdocWiseHistoryObj = { ...refdocHistoryArr[refdocHistoryArr.length - 1] };
			refdocWiseHistoryObj["refdocHistory"] = refdocHistoryArr;
			refdocWiseHistoryArr.push(refdocWiseHistoryObj);
		}
		refdocWiseHistoryArr.sort((a, b) => b.historyId - a.historyId);
		refdocWiseHistoryArr.forEach((data) => {
			data.refdocHistory.sort((a, b) => b.historyId - a.historyId);
		});
		return refdocWiseHistoryArr;
	}

	async validateUserForRefdoc(participantsData: any[], primaryUserData: any, userId: number, refdocId: number) {
		let validUser = false;
		let userType, benificiaryUserId;
		participantsData.forEach((participantData) => {
			if (participantData.participantUserId === userId.toString()) {
				validUser = true;
				userType = LeaseParticipantType.PARTICIPANT;
				benificiaryUserId = participantData.userId;
			}
		});
		if (primaryUserData.participantUserId === userId.toString()) {
			validUser = true;
			userType = LeaseParticipantType.SELF;
			benificiaryUserId = primaryUserData.participantUserId;
		}
		if (!validUser) {
			const payeeUser = await this.participantDaoService.getPaymentUserDataByPayeeIdAndRefdocId(userId, refdocId);
			if (payeeUser) {
				validUser = true;
				userType = LeaseParticipantType.PAYMENT_REQUEST;
				benificiaryUserId = payeeUser.userId;
			}
		}
		if (!validUser) {
			throw new HttpException({ data: {}, status: ResponseData.INVALID_REFDOC_ID }, HttpStatus.OK);
		}
		return { userType, benificiaryUserId };
	}

	async validateRentPaymentRequest(saveRentPaymentDetails: SaveRentPaymentDetails, userId: number) {
		const { refdocId, isPrimaryUser, participant } = saveRentPaymentDetails;
		if (isPrimaryUser === YesNoEnum.YES) {
			return await this.docDaoService.getUserRefdocMasterData(userId, refdocId);
		}
		if (participant === YesNoEnum.YES) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		await this.participantDaoService.getUserParticipantDataByParticipantAndRefdocId(
			refdocId,
			userId,
			RequestStatusEnum.REQUESTED
		);
	}

	async updateRefdocStatusForComplete(refdocId: number, userId: number, queryRunner: QueryRunner) {
		const refdoc = await this.docDaoService.getUserRefdocMasterDataByRefdoc(userId, refdocId);
		if (refdoc.status != RefdocMasterStatusEnum.REQUESTED && refdoc.status != RefdocMasterStatusEnum.APPROVED) {
			if (refdoc.documentPath) {
				refdoc.status = RefdocMasterStatusEnum.REQUESTED;
				await this.saveRefdocHistoryDataByQueryRunner(refdoc, queryRunner);
			} else refdoc.status = RefdocMasterStatusEnum.LEASE_PENDING;
			await this.docDaoService.saveRefdocMasterByQueryRunner(refdoc, queryRunner);
		}
	}

	async getRefdocFullDetails(refdocId: number, dateFormat: string, currencyFormattingData) {
		const stateCodeToNameMapping = await this.commonUtilityService.getStateCodeToNameMapping();
		const refdocDetails = await this.docDaoService.getRefdocFullDetailById(refdocId);
		const extraDetails = await this.docDaoService.getRefdocExtraDetailsById(refdocId);
		const extraDetailsFormattingReq = [
			"securityDespositAmount",
			"proratedRentAmount",
			"monthlyBaseRentAmount",
			"animalViolationChargeAmount",
			"payFailureFeeAmount"
		];
		extraDetails.forEach((extraDetail) => {
			if (extraDetailsFormattingReq.includes(extraDetail.key)) {
				extraDetail["formattedValue"] = this.commonUtilityService.formatCurrency(
					currencyFormattingData,
					+extraDetail.value
				);
			}
			refdocDetails[extraDetail.key] = extraDetail.value;
		});
		refdocDetails["state"] = stateCodeToNameMapping[refdocDetails["state"]];
		refdocDetails["validFrom"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			refdocDetails["validFrom"],
			dateFormat
		);
		refdocDetails["validTo"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			refdocDetails["validTo"],
			dateFormat
		);
		refdocDetails["verifiedAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			refdocDetails["verifiedAt"],
			dateFormat
		);
		refdocDetails["rentDueDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			refdocDetails["rentDueDate"],
			dateFormat
		);
		refdocDetails["rentPaymentDueDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			refdocDetails["rentPaymentDueDate"],
			dateFormat
		);
		refdocDetails["uploadedDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			refdocDetails["uploadedDate"],
			dateFormat
		);
		refdocDetails["remark"] = JSON.parse(refdocDetails["remark"]);
		refdocDetails["rentAmount"] = this.commonUtilityService.formatCurrency(
			currencyFormattingData,
			refdocDetails["rentAmount"]
		);
		refdocDetails["baseAmount"] = this.commonUtilityService.formatCurrency(
			currencyFormattingData,
			refdocDetails["baseAmount"]
		);
		return refdocDetails;
	}

	async getRefdocDataFromInterimData(refdocData, currencyFormattingData: Object) {
		const refdocInterimData = refdocData.interimData ? JSON.parse(refdocData.interimData) : {};
		refdocInterimData["statusDesc"] = refdocData.statusDesc;
		refdocInterimData["refdocUsers"] = await this.getRefdocParticipantDetails(
			refdocData.refdocId,
			refdocInterimData.participantsDetails,
			refdocData["status"]
		);
		const stateCodeToNameMapping = await this.commonUtilityService.getStateCodeToNameMapping();
		refdocInterimData["cityName"] = refdocInterimData["city"];
		refdocInterimData["stateName"] = stateCodeToNameMapping[refdocInterimData["state"]];

		refdocInterimData["formattedRentAmount"] = this.commonUtilityService.formatCurrency(
			currencyFormattingData,
			refdocInterimData["rentAmount"]
		);
		refdocInterimData["formattedBaseAmount"] = this.commonUtilityService.formatCurrency(
			currencyFormattingData,
			refdocInterimData["baseAmount"]
		);
		refdocInterimData["paymentSchedule"].forEach((schedule) => {
			schedule["pendingManualPayments"] = "0";
			schedule["formattedAmount"] = this.commonUtilityService.formatCurrency(
				currencyFormattingData,
				schedule["amount"]
			);
			if (!schedule[VariablesConstant.MODIFIED_AMOUNT] || schedule[VariablesConstant.MODIFIED_AMOUNT] == 0) {
				schedule[VariablesConstant.MODIFIED_AMOUNT] = schedule["amount"];
			}
			schedule["formattedModifiedAmount"] = this.commonUtilityService.formatCurrency(
				currencyFormattingData,
				schedule[VariablesConstant.MODIFIED_AMOUNT]
			);
		});

		refdocInterimData["firstName"] = refdocInterimData["firstName"]
			? this.commonUtilityService.capitalizeWords(refdocInterimData["firstName"])
			: this.commonUtilityService.capitalizeWords(refdocData["userFirstName"]);
		refdocInterimData["lastName"] = refdocInterimData["lastName"]
			? this.commonUtilityService.capitalizeWords(refdocInterimData["lastName"])
			: this.commonUtilityService.capitalizeWords(refdocData["userLastName"]);
		refdocInterimData["middleName"] = refdocInterimData["middleName"]
			? this.commonUtilityService.capitalizeWords(refdocInterimData["middleName"])
			: this.commonUtilityService.capitalizeWords(refdocData["userMiddleName"]);
		refdocInterimData["suffixName"] = refdocInterimData["suffixName"]
			? this.commonUtilityService.capitalizeWords(refdocInterimData["suffixName"])
			: this.commonUtilityService.capitalizeWords(refdocData["userSuffixName"]);

		refdocInterimData["remark"] = JSON.parse(refdocInterimData["remark"]);
		refdocInterimData["ownerName"] = this.commonUtilityService.capitalizeWords(refdocInterimData["ownerName"]);
		return refdocInterimData;
	}

	async getRefdocParticipantDetails(refdocId: number, participantDetails: any[], refdocStatus) {
		const userDetails = [];
		const refdocUsers = await this.userDaoService.getUserInfoOfRefdocUsersByRefdocId(refdocId);
		const registeredParticipantData: Map<string, any> = new Map();
		const participantToVeridocIdMapping: Map<string, string[]> = new Map();
		refdocUsers.forEach((refdocUserDetails) => {
			const tenantId = refdocUserDetails.tenantId;
			if (!registeredParticipantData.has(tenantId)) {
				const data = {
					participantId: refdocUserDetails.tenantId,
					name: this.commonUtilityService.capitalizeWords(refdocUserDetails.tenantUserName),
					participantStatus: RefdocUserStatusEnum.PARTICIPANT,
					id: null,
					paydocDetails: {
						paydocUserId: refdocUserDetails.paydocUserId,
						payDocUserName: this.commonUtilityService.capitalizeWords(refdocUserDetails.paydocUserName)
					},
					veridocDetails: []
				};
				registeredParticipantData.set(tenantId, data);
				participantToVeridocIdMapping.set(tenantId, []);
			}
			const userDetails = registeredParticipantData.get(tenantId);
			if (refdocUserDetails.veridocUserId) {
				const veriDocUserData = {
					veridocUserId: refdocUserDetails.veridocUserId,
					veridocUserName: this.commonUtilityService.capitalizeWords(refdocUserDetails.veridocUserName),
					veridocUserStatus: RefdocUserStatusEnum.PARTICIPANT
				};
				participantToVeridocIdMapping.set(tenantId, [
					...participantToVeridocIdMapping.get(tenantId),
					refdocUserDetails.veridocUserId
				]);
				userDetails.veridocDetails = [...userDetails.veridocDetails, veriDocUserData];
			}
			registeredParticipantData.set(tenantId, userDetails);
		});
		const payeeDetails = await this.participantDaoService.getPaymentUserDataByRefdocId(refdocId);
		payeeDetails.forEach((payeeUser) => {
			let veridocUserStatus;
			if (payeeUser.status === RequestStatusEnum.VERIFICATION_PENDING) {
				veridocUserStatus = RefdocUserStatusEnum.INVITATION_PENDING;
			} else if (
				participantToVeridocIdMapping.get(payeeUser.userId?.toString()).includes(payeeUser.payeeUserId?.toString())
			) {
				veridocUserStatus = RefdocUserStatusEnum.PARTICIPANT;
			} else {
				veridocUserStatus = RefdocUserStatusEnum.INVITED;
			}
			if (veridocUserStatus !== RefdocUserStatusEnum.PARTICIPANT) {
				const veriDocUserData = {
					veridocUserId: payeeUser.payeeUserId,
					veridocUserName: this.commonUtilityService.capitalizeWords(payeeUser.payeeUsername),
					veridocUserStatus: veridocUserStatus
				};
				const userDetails = registeredParticipantData.get(payeeUser.userId?.toString());
				userDetails.veridocDetails = [...userDetails.veridocDetails, veriDocUserData];
				registeredParticipantData.set(payeeUser.userId?.toString(), userDetails);
			}
		});
		registeredParticipantData.forEach((userDetailData) => {
			userDetails.push(userDetailData);
		});
		participantDetails?.forEach((participant) => {
			if (participant.status === RequestStatusEnum.NEW_PARTICIPANT) {
				const data = {
					participantId: null,
					name: this.commonUtilityService.capitalizeWords(participant.name),
					participantStatus: participant.status,
					id: participant.id || null,
					paydocDetails: null,
					veridocDetails: []
				};
				userDetails.push(data);
			} else if (
				participant.status === RequestStatusEnum.VERIFICATION_PENDING ||
				participant.status === RequestStatusEnum.REJECTED ||
				participant.status === RequestStatusEnum.APPROVED
			) {
				const data = {
					participantId: participant.participantUserId,
					name: this.commonUtilityService.capitalizeWords(participant.name),
					participantStatus: participant.status,
					id: participant.id,
					paydocDetails: null,
					veridocDetails: []
				};
				userDetails.push(data);
			} else if (
				participant.status === RequestStatusEnum.REQUESTED &&
				!registeredParticipantData.has(participant.participantUserId)
			) {
				const data = {
					participantId: participant.participantUserId,
					name: this.commonUtilityService.capitalizeWords(participant.name),
					participantStatus: RefdocUserStatusEnum.INVITED,
					id: participant.id,
					paydocDetails: null,
					veridocDetails: []
				};
				userDetails.push(data);
			}
		});
		return userDetails;
	}

	async handleRefdocUserEntry(
		isOtherPayee: YesNoEnum,
		refdocId: number,
		benificiaryUserId: number,
		userId: number,
		queryRunner: QueryRunner
	) {
		let refdocUserData;
		if (isOtherPayee === YesNoEnum.YES) {
			refdocUserData = await this.docDaoService.getRefdocUsersData(refdocId, benificiaryUserId, Status.ACTIVE);
		} else {
			refdocUserData = await this.docDaoService.getRefdocUsersData(refdocId, userId, Status.ACTIVE);
		}

		let nullVeridocRefdocUser: RefdocUsersEntity;
		let paydocUserId = null;
		const veridocUserIdArr = refdocUserData.map((refdocUsers) => {
			if (!refdocUsers.veridocUserId) {
				nullVeridocRefdocUser = refdocUsers;
			}
			if (!paydocUserId) {
				paydocUserId = refdocUsers.paydocUserId;
			}
			return refdocUsers.veridocUserId;
		});
		if (!veridocUserIdArr.includes(userId.toString())) {
			if (nullVeridocRefdocUser) {
				nullVeridocRefdocUser.veridocUserId = userId;
				await this.docDaoService.saveRefdocUsersDataByQueryRunner(nullVeridocRefdocUser, queryRunner);
			} else {
				let refdocUser;
				if (isOtherPayee === YesNoEnum.YES) {
					refdocUser = new RefdocUsersEntity(refdocId, benificiaryUserId, paydocUserId, userId, Status.ACTIVE);
				} else {
					refdocUser = new RefdocUsersEntity(refdocId, userId, paydocUserId, userId, Status.ACTIVE);
				}
				await this.docDaoService.saveRefdocUsersDataByQueryRunner(refdocUser, queryRunner);
			}
		}
	}

	async addRefdocUsersForApp(participantData, refdocId: number, tenantId: number) {
		const refdocUsers = await this.docDaoService.getRefdocUsersWithUserInfos(refdocId, tenantId, Status.ACTIVE);
		refdocUsers.forEach((refdocUser) => {
			if (!participantData["subscriptionUser"]) {
				const subscriptionUserObj = {};
				subscriptionUserObj["subscriptionUserId"] = refdocUser.paydocUserId;
				subscriptionUserObj["subscriptionUserName"] = this.commonUtilityService.capitalizeWords(
					refdocUser.paydocName
				);
				participantData["subscriptionUser"] = subscriptionUserObj;
			}
			if (!participantData["payeeUsers"]) {
				participantData["payeeUsers"] = [];
			}
			const payeeDataObj = {};
			payeeDataObj["payeeUserId"] = refdocUser.veridocUserId;
			payeeDataObj["payeeName"] = this.commonUtilityService.capitalizeWords(refdocUser.veridocName);
			participantData["payeeUsers"].push(payeeDataObj);
		});
	}
}
