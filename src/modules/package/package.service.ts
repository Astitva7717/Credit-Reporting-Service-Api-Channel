import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreatePackageDto } from "./dto/create-package.dto";
import { ResponseData } from "@utils/enums/response";
import { PackageDaoService } from "@modules/dao/package-dao/package-dao.service";
import {
	InviteeTypeEnum,
	MonthlyProofStatusEnum,
	PackagePaymentByEnum,
	PaymentStatusEnum,
	Status,
	SubscriptionPaymentTypeEnum,
	UserProfileStatusEnum,
	YNStatusEnum,
	YesNoEnum
} from "@utils/enums/Status";
import { PackageMaster } from "./entities/package-master.entity";
import { UserSubscriptionTransactions } from "./entities/user-subscription-txn.entity";
import { DocDaoService } from "@modules/dao/doc-dao/doc-dao.service";
import { UserDaoService } from "@modules/dao/user-dao/user-dao.service";
import { UserType } from "@utils/enums/user-types";
import { ExternalUrlsService } from "@utils/constants/urls";
import VariablesConstant from "@utils/variables-constant";
import { ParticipantDaoService } from "@modules/dao/participant-dao/participant-dao.service";
import { CommonUtilityService } from "@utils/common/common-utility/common-utility.service";
import { UserPackageSubscriptionDto } from "./dto/UserPackageSubscription.dto";
import { isPrimary } from "@modules/doc/entities/refdoc-participants-master.entity";
import { KafkaPurchaseInititateDto } from "./dto/kafka-purchase-initiate.dto";
import { UserMasterEntity } from "@modules/user-master/entities/user-master.entity";
import { ExternalApiCallService } from "@utils/common/external-api-call/external-api-call.service";
import { BuisnessTypeEnum, RefdocMaster, RefdocMasterStatusEnum } from "@modules/doc/entities/refdoc-master.entity";
import { ConfigurationService } from "@utils/configuration/configuration.service";
import { ConfigCodeEnum } from "@utils/enums/constants";
import { GetPaymentIdDto } from "./dto/get-payment-id.dto";
import { CancelSubscriptionDto } from "./dto/cancel-subscription.dto";
import { UserProfileProgress } from "@modules/user-master/entities/user-profile-progress-status.entity";
import { RefdocUsersEntity } from "@modules/doc/entities/refdoc-users.entity";
import { DataSource, QueryRunner } from "typeorm";
import { MonthMapEnum, MonthNameToNumberEnum } from "@utils/constants/map-month-constants";
import {
	ReportingStatus,
	UserCreditReportingRequests
} from "@modules/reporting/entities/user-credit-reporting-request.entity";
import { ReportingDaoService } from "@modules/dao/reporting-dao/reporting-dao.service";
import { UserPaymentScheduleStatus } from "@modules/doc/entities/user-payment-schedule.entity";
import { ValidationDocMonthlyProof } from "@modules/monthly-proof/entities/validation-doc-monthly-proof.entity";
import {
	MasterProofTypeEnum,
	ProofStatus,
	ValidationDocMasterProof
} from "@modules/doc/entities/validation-doc-master-proof.entity";
import { MonthlyProofTypeEnum } from "@utils/enums/txn-types";
import { MonthlyDocDaoService } from "@modules/dao/monthly-doc-dao/monthly-doc-dao.service";

@Injectable()
export class PackageService {
	constructor(
		private readonly packageDaoService: PackageDaoService,
		private readonly docDaoService: DocDaoService,
		private readonly userDaoService: UserDaoService,
		private readonly externalUrlsService: ExternalUrlsService,
		private readonly participantDaoService: ParticipantDaoService,
		private readonly commonUtilityService: CommonUtilityService,
		private readonly externalApiCallService: ExternalApiCallService,
		private readonly configurationService: ConfigurationService,
		private readonly dataSource: DataSource,
		private readonly reportingRequestDaoService: ReportingDaoService,
		private readonly monthlyDocDaoService: MonthlyDocDaoService
	) {}
	/**
	 *
	 * @param createPackageDto
	 * @returns
	 * @author Ankit Singh
	 */
	async create(createPackageDto: CreatePackageDto) {
		if (
			!createPackageDto.code ||
			!createPackageDto.description ||
			isNaN(createPackageDto?.firstUnitPrice) ||
			isNaN(createPackageDto?.firstUnitPriceStudent) ||
			!createPackageDto.name ||
			isNaN(createPackageDto.otherUnitPrice) ||
			isNaN(createPackageDto.otherUnitPriceStudent)
		) {
			throw new HttpException({ data: {}, status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		let packageData = await this.packageDaoService.getPackageDataByCodeAndStatus(createPackageDto.code, Status.ACTIVE);
		if (packageData) {
			throw new HttpException({ data: {}, status: ResponseData.PACKAGE_ALREADY_EXIST }, HttpStatus.OK);
		}
		await this.docDaoService.getRefDocTypeById(createPackageDto.refdocTypeId);
		let newPackage = new PackageMaster(
			createPackageDto.code,
			createPackageDto.firstUnitPrice,
			createPackageDto.otherUnitPrice,
			createPackageDto.firstUnitPriceStudent,
			createPackageDto.otherUnitPriceStudent,
			Status.ACTIVE,
			createPackageDto.refdocTypeId
		);
		newPackage.addPackageDetails(createPackageDto.name, createPackageDto.description);
		await this.packageDaoService.createNewPackage(newPackage);
	}

	getLastDateOfMonth(validityMonth: number) {
		let currDate = new Date();
		let last = new Date(currDate.getFullYear(), currDate.getMonth() + validityMonth, 0);
		last.setHours(23);
		last.setMinutes(59);
		last.setSeconds(59);
		return last;
	}

	getValidTillTimeFromMonthAndYear(month: number, year: number) {
		let lastDate = new Date(year, month - 1, 0);
		lastDate.setHours(23);
		lastDate.setMinutes(59);
		lastDate.setSeconds(59);
		return lastDate;
	}

	async getAllPackagesByRefDocType(refDocTypeId?: number) {
		await this.docDaoService.getRefDocTypeById(refDocTypeId);
		let packages: PackageMaster[];
		if (refDocTypeId) {
			packages = await this.packageDaoService.getPackagesByRefDocTypeId(refDocTypeId);
		} else {
			packages = await this.packageDaoService.getAllPackages();
		}
		if (!packages.length) {
			throw new HttpException({ data: {}, status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return packages;
	}

	async getPaymentTypes() {
		let paymentTypes = await this.packageDaoService.getAllPaymentTypes();
		if (!paymentTypes.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return paymentTypes;
	}

	async getUserRefdocSubscription(userPackageSubscriptionDto: UserPackageSubscriptionDto, request: any) {
		const { businessId, channelId } = request.headers;
		const { refdocId } = userPackageSubscriptionDto;
		const benificiarySystemUserId = userPackageSubscriptionDto.benificiaryUserId;
		const benificiaryUserId = await this.userDaoService.getUserIdFromSystemUserId(
			businessId,
			channelId,
			benificiarySystemUserId.toString(),
			UserType.CONSUMER
		);
		const refdocSubscriptionData = await this.packageDaoService.getUserSubByRefDocId(
			benificiaryUserId,
			refdocId,
			PaymentStatusEnum.PAYMENT_DONE
		);
		const configs = await this.configurationService.getChannelConfigurations(channelId);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT) || "MM-DD-YYYY";
		refdocSubscriptionData["renewalMonth"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			refdocSubscriptionData.renewalMonth.toString(),
			dateFormat
		) as any;
		return refdocSubscriptionData;
	}

	async validatePaymentId(paymentId: string) {
		if (!paymentId) {
			throw new HttpException({ data: {}, status: ResponseData.INVALID_PAYMENT_ID }, HttpStatus.OK);
		}
		if (await this.packageDaoService.getPaymentDoneTxnsByRefId(paymentId)) {
			throw new HttpException({ data: {}, status: ResponseData.DUPLICATE_PAYMENT_ID }, HttpStatus.OK);
		}
	}

	async purchaseInitiateFromKafka(kafkaPurchaseInititateDto: KafkaPurchaseInititateDto) {
		const { packageId, userId, paymentBy, paymentType, paymentId } = kafkaPurchaseInititateDto;
		await this.validateKafkaPurchaseInitiateRequest(kafkaPurchaseInititateDto);
		let packageData = await this.packageDaoService.getPackageById(packageId);
		if (!packageData) {
			throw new HttpException({ data: {}, status: ResponseData.INVALID_PACKAGE_ID }, HttpStatus.OK);
		}
		await this.validatePaymentId(paymentId);
		let userInfo = await this.userDaoService.getUserInfoFromSystemUserId(userId.toString(), UserType.CONSUMER);
		if (paymentType === SubscriptionPaymentTypeEnum.MODIFY_SUBSCRIPTION) {
			return await this.modifyPackagePurchaseFromUser(kafkaPurchaseInititateDto, userInfo, packageData);
		} else if (paymentType === SubscriptionPaymentTypeEnum.LOOKBACK_SUBSCRIPTION) {
			return await this.handleLookBackSubscription(kafkaPurchaseInititateDto, userInfo, packageData);
		} else if (paymentType === SubscriptionPaymentTypeEnum.SUBSCRIPTION) {
			if (paymentBy === PackagePaymentByEnum.SELF) {
				await this.packagePurchaseFromUser(kafkaPurchaseInititateDto, userInfo, packageData);
			} else {
				await this.packagePurchaseFromInvitedUser(kafkaPurchaseInititateDto, userInfo, packageData);
			}
			userInfo.payDocParticipant = YNStatusEnum.YES;
			await this.userDaoService.save(userInfo);
		}
	}

	async handleLookBackSubscription(
		kafkaPurchaseInititateDto: KafkaPurchaseInititateDto,
		userInfo: UserMasterEntity,
		packageData: PackageMaster
	) {
		const { refDocId } = kafkaPurchaseInititateDto;
		const benificiarySystemUserId = kafkaPurchaseInititateDto.benificiaryUserId;
		const benificiaryUserId = await this.userDaoService.getUserIdFromSystemUserIdAndUserType(
			benificiarySystemUserId.toString(),
			UserType.CONSUMER
		);
		await this.docDaoService.getRefdocParticipantDataByUser(refDocId, benificiaryUserId, Status.ACTIVE);
		const firstSubscription = await this.packageDaoService.getUserFirstSubscriptionForRefdoc(
			benificiaryUserId,
			refDocId
		);
		if (!firstSubscription) {
			throw new HttpException({ data: {}, status: ResponseData.FIRST_SUBSCRIPTION_NOT_FOUND }, HttpStatus.OK);
		}
		const monthFirstDate = this.commonUtilityService.getFirstDateOfMonthFromMonthYear(
			firstSubscription.subscriptionMonth,
			firstSubscription.subscriptionYear
		);
		const subscriptionValidTill = this.getValidTillTimeFromMonthAndYear(
			MonthNameToNumberEnum[firstSubscription.subscriptionMonth],
			firstSubscription.subscriptionYear
		);
		const userPaymentSchedules = await this.docDaoService.getUserPaymentSchedulesBeforeDueDate(
			benificiaryUserId,
			refDocId,
			monthFirstDate
		);
		if (!userPaymentSchedules.length) {
			throw new HttpException({ data: {}, status: ResponseData.USER_PAYMENT_SCHEDULE_NOT_FOUND }, HttpStatus.OK);
		}
		const userPlaidMasterProofs = await this.docDaoService.getMasterProofByUserRefdocMasterProofTypeAndStatus(
			benificiaryUserId,
			refDocId,
			MasterProofTypeEnum.PLAID,
			ProofStatus.APPROVED
		);
		if (!userPlaidMasterProofs.length) {
			throw new HttpException({ status: ResponseData.MASTERPROOF_NOT_FOUND }, HttpStatus.OK);
		}
		const plaidMonthlyProofs: ValidationDocMonthlyProof[] = [];
		let monthAndYearObj = {
			month: MonthNameToNumberEnum[firstSubscription.subscriptionMonth],
			year: firstSubscription.subscriptionYear
		};

		const userPaymentScheduleIds: any[] = [];

		for (const userSchedule of userPaymentSchedules) {
			userPaymentScheduleIds.push(userSchedule.id);
			const currentPaymentSchedule = await this.docDaoService.getPaymentScheduleByScheduleId(
				userSchedule.refScheduleId
			);

			const dueDate = new Date(currentPaymentSchedule.dueDate);
			const nextMonthDueDate = this.commonUtilityService.getLastDateOfMonth(dueDate);
			const fetchTill = new Date(nextMonthDueDate);
			if (MonthNameToNumberEnum[userSchedule.month] < monthAndYearObj["month"]) {
				monthAndYearObj["month"] = MonthNameToNumberEnum[userSchedule.month];
			}

			if (userSchedule.year < monthAndYearObj["year"]) {
				monthAndYearObj["year"] = userSchedule.year;
			}

			this.addMonthlyProofEntitiesForPaymentSchedule(
				benificiaryUserId,
				plaidMonthlyProofs,
				userSchedule,
				userPlaidMasterProofs,
				fetchTill
			);
		}

		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			await this.docDaoService.updateUserPaymentScheduleByIds(
				userPaymentScheduleIds,
				UserPaymentScheduleStatus.LOOKBACK_DATE_FETCH_PENDING,
				queryRunner
			);
			await this.monthlyDocDaoService.insertMonthlyProofDetailsByQueryRunner(plaidMonthlyProofs, queryRunner);
			await this.saveUserSubscriptionData(
				kafkaPurchaseInititateDto,
				userInfo,
				packageData,
				benificiaryUserId,
				subscriptionValidTill,
				monthAndYearObj,
				queryRunner
			);
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	addMonthlyProofEntitiesForPaymentSchedule(
		benificiaryUserId: number,
		plaidMonthlyProofs: ValidationDocMonthlyProof[],
		userSchedule: any,
		userPlaidMasterProofs: ValidationDocMasterProof[],
		fetchTill: Date
	) {
		userPlaidMasterProofs.forEach((userMasterProof) => {
			const plaidMonthlyProof = new ValidationDocMonthlyProof(
				benificiaryUserId,
				userMasterProof.id,
				MonthlyProofTypeEnum.TRANSACTION,
				0,
				null,
				MonthlyProofStatusEnum.LOOKBACK_DATE_FETCH_PENDING
			);
			plaidMonthlyProof.updateRefdocDueDates(userSchedule.month, userSchedule.year);
			plaidMonthlyProof.fetchTill = fetchTill;
			plaidMonthlyProofs.push(plaidMonthlyProof);
		});
	}

	async saveUserSubscriptionData(
		kafkaPurchaseInititateDto: KafkaPurchaseInititateDto,
		userInfo: UserMasterEntity,
		packageData: PackageMaster,
		benificiaryUserId: number,
		subscriptionValidTill: Date,
		monthAndYearObj,
		queryRunner: QueryRunner
	) {
		const { amount, refDocId, paymentType, paymentMethodId, paymentId } = kafkaPurchaseInititateDto;
		let newSubscriptionTxn: UserSubscriptionTransactions = new UserSubscriptionTransactions(
			packageData.packageId,
			userInfo.userId,
			benificiaryUserId,
			null,
			true,
			packageData.firstUnitPrice,
			+amount
		);
		newSubscriptionTxn.addSubscriptionTransactionDetails(
			subscriptionValidTill,
			PaymentStatusEnum.PAYMENT_DONE,
			refDocId,
			paymentType,
			paymentMethodId,
			paymentId.toString()
		);
		(await this.isFirstSubscriptionForRefdoc(benificiaryUserId, refDocId))
			? newSubscriptionTxn.setFirstSubscription(YesNoEnum.YES)
			: newSubscriptionTxn.setFirstSubscription(YesNoEnum.NO);
		const { month, year } = monthAndYearObj;
		newSubscriptionTxn.updateSubscriptionMonthAndYear(MonthMapEnum[month], year);
		newSubscriptionTxn.updateSubscriptionAutoRenewal(false);
		await this.packageDaoService.createUserSubscriptionTxnByQueryRunner(newSubscriptionTxn, queryRunner);
	}

	async packagePurchaseFromInvitedUser(
		kafkaPurchaseInititateDto: KafkaPurchaseInititateDto,
		userInfo: UserMasterEntity,
		packageData: PackageMaster
	) {
		const { packageId, refDocId, paymentMethodId, paymentType, paymentId, amount, payeeType } =
			kafkaPurchaseInititateDto;
		const userId = userInfo.userId;
		const benificiarySystemUserId = kafkaPurchaseInititateDto.benificiaryUserId;
		const benificiaryUserId = await this.userDaoService.getUserIdFromSystemUserIdAndUserType(
			benificiarySystemUserId.toString(),
			UserType.CONSUMER
		);
		if (payeeType === InviteeTypeEnum.PARTICIPANT) {
			await this.participantDaoService.getUserParticipantsDataByParticipant(benificiaryUserId, refDocId, userId);
		} else {
			await this.participantDaoService.getInvitedUserPaymentRequestDataByPayeeUser(
				benificiaryUserId,
				refDocId,
				userId
			);
		}
		let lastTxn = await this.packageDaoService.getUsersLastValidTill(
			benificiaryUserId,
			packageId,
			refDocId,
			PaymentStatusEnum.PAYMENT_DONE
		);
		let renewalDate = this.commonUtilityService.getPackageRenewalDate(1);
		let validTill = this.getLastDateOfMonth(1);
		let { month, year } = this.commonUtilityService.getMonthAndYearFromDate(new Date());
		if (lastTxn) {
			let months = this.commonUtilityService.getNumberOfMonthsBetweenDates(new Date(), lastTxn.lastRenewalMonth);
			renewalDate = this.commonUtilityService.getPackageRenewalDate(months + 1);
			validTill = this.getLastDateOfMonth(months + 1);
			const renewalData = this.commonUtilityService.getMonthAndYearFromDate(lastTxn.lastRenewalMonth);
			month = renewalData.month;
			year = renewalData.year;
		}
		let newSubscriptionTxn: UserSubscriptionTransactions = new UserSubscriptionTransactions(
			packageId,
			userId,
			benificiaryUserId,
			new Date(renewalDate),
			true,
			packageData.firstUnitPrice,
			+amount
		);
		newSubscriptionTxn.addSubscriptionTransactionDetails(
			validTill,
			PaymentStatusEnum.PAYMENT_DONE,
			refDocId,
			paymentType,
			paymentMethodId,
			paymentId.toString()
		);
		newSubscriptionTxn.setFirstSubscription(YesNoEnum.NO);
		newSubscriptionTxn.updateSubscriptionMonthAndYear(MonthMapEnum[month], year);
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			let purchaseTxn = await this.packageDaoService.createUserSubscriptionTxnByQueryRunner(
				newSubscriptionTxn,
				queryRunner
			);
			await this.packageDaoService.updateUserSubcriptionAutoRenewalQueryRunner(
				benificiaryUserId,
				refDocId,
				purchaseTxn.id,
				false,
				queryRunner
			);
			await this.handleRefdocUsersEntry(refDocId, userId, queryRunner, benificiaryUserId);
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	async handleRefdocUsersEntry(refdocId: number, userId: number, queryRunner: QueryRunner, benificiaryUserId?: number) {
		const refdocUsersData = await this.docDaoService.getRefdocUsersData(refdocId, benificiaryUserId, Status.ACTIVE);
		const refdocUserDataArr: RefdocUsersEntity[] = [];
		for (const refdocUser of refdocUsersData) {
			if (refdocUser.paydocUserId !== userId) {
				refdocUser.updateStatus(Status.INACTIVE);
				refdocUserDataArr.push(refdocUser);
				const refdocUserData: RefdocUsersEntity = new RefdocUsersEntity(
					refdocId,
					benificiaryUserId,
					userId,
					refdocUser.veridocUserId,
					Status.ACTIVE
				);
				refdocUserDataArr.push(refdocUserData);
			}
		}
		if (refdocUserDataArr.length) {
			await this.docDaoService.saveMultipleRefdocUsersDataByQueryRunner(refdocUserDataArr, queryRunner);
		}
	}

	async packagePurchaseFromUser(
		kafkaPurchaseInititateDto: KafkaPurchaseInititateDto,
		userInfo: UserMasterEntity,
		packageData: PackageMaster
	) {
		let { packageId, refDocId, paymentMethodId, isParticipant, paymentType, paymentId, amount } =
			kafkaPurchaseInititateDto;
		let renewalDate = this.commonUtilityService.getPackageRenewalDate(1);
		let validTill = this.getLastDateOfMonth(1);
		let userId = userInfo.userId;
		let benificiaryUserId = userInfo.userId;
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			if (isParticipant === YesNoEnum.NO) {
				refDocId = await this.createEmptyRefdoc(userId, packageData?.refdocTypeId, packageId, queryRunner);
			}
			refDocId = isNaN(parseInt(refDocId?.toString())) ? null : refDocId;
			let newSubscriptionTxn: UserSubscriptionTransactions = new UserSubscriptionTransactions(
				packageId,
				userId,
				benificiaryUserId,
				new Date(renewalDate),
				true,
				packageData.firstUnitPrice,
				+amount
			);
			newSubscriptionTxn.addSubscriptionTransactionDetails(
				validTill,
				PaymentStatusEnum.PAYMENT_DONE,
				refDocId || null,
				paymentType,
				paymentMethodId,
				paymentId.toString()
			);
			(await this.isFirstSubscriptionForRefdoc(userId, refDocId))
				? newSubscriptionTxn.setFirstSubscription(YesNoEnum.YES)
				: newSubscriptionTxn.setFirstSubscription(YesNoEnum.NO);
			const { month, year } = this.commonUtilityService.getMonthAndYearFromDate(new Date());
			newSubscriptionTxn.updateSubscriptionMonthAndYear(MonthMapEnum[month], year);
			await this.packageDaoService.createUserSubscriptionTxnByQueryRunner(newSubscriptionTxn, queryRunner);
			const refdocUsersData = await this.docDaoService.getRefdocUsersData(refDocId, userId, Status.ACTIVE);
			const refdocUserDataArr: RefdocUsersEntity[] = [];
			if (refdocUsersData.length) {
				for (const refdocUser of refdocUsersData) {
					refdocUser.paydocUserId = userId;
					refdocUserDataArr.push(refdocUser);
				}
				await this.docDaoService.saveMultipleRefdocUsersDataByQueryRunner(refdocUserDataArr, queryRunner);
			} else {
				const refdocUser: RefdocUsersEntity = new RefdocUsersEntity(refDocId, userId, userId, null, Status.ACTIVE);
				await this.docDaoService.saveRefdocUsersDataByQueryRunner(refdocUser, queryRunner);
			}

			let previousUserProfileStatus = UserProfileStatusEnum.SUBSCRIPTION_PENDING;
			let newUserProfileStatus = UserProfileStatusEnum.REFDOC_PENDING;
			if (isParticipant === YesNoEnum.YES) {
				await this.docDaoService.updateParticipantCbReportingStatus(refDocId, userId, isPrimary.Y, queryRunner);
				await this.addReportingRequest(userId, MonthMapEnum[month], year, refDocId, queryRunner);
			} else {
				const data = {
					paymentId
				};
				const userProfileStatus = await this.userDaoService.getUserProfileDataForRefdoc(userId, null);
				if (userProfileStatus) {
					await this.commonUtilityService.updateUserProfileStatus(
						userId,
						previousUserProfileStatus,
						newUserProfileStatus,
						JSON.stringify(data),
						null,
						queryRunner,
						userProfileStatus
					);
				} else {
					let userProfileProgressMasterEntity: UserProfileProgress = new UserProfileProgress(
						userId,
						newUserProfileStatus,
						JSON.stringify(data),
						refDocId
					);
					await this.userDaoService.addUserProfileDataByQueryRunner(userProfileProgressMasterEntity, queryRunner);
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

	async addReportingRequest(userId: number, month: string, year: number, refdocId: number, queryRunner: QueryRunner) {
		const userPaymentSchedule = await this.docDaoService.getUserPaymentScheduleForMonthYearRefdocId(
			month,
			year,
			userId,
			refdocId,
			queryRunner
		);
		if (!userPaymentSchedule) return;
		const userReportingRequest = new UserCreditReportingRequests(
			userId,
			userPaymentSchedule.id,
			refdocId,
			ReportingStatus.AMOUNT_DUE
		);
		await this.reportingRequestDaoService.saveReportingRequest(userReportingRequest, queryRunner);
	}

	async isFirstSubscriptionForRefdoc(userId: number, refdocId: number) {
		const prevSubscriptions = await this.packageDaoService.getUserAllSubscriptionTxnsForRefdoc(userId, refdocId);
		if (prevSubscriptions.length) {
			return false;
		}
		return true;
	}

	async validateKafkaPurchaseInitiateRequest(kafkaPurchaseInititateDto: KafkaPurchaseInititateDto) {
		let {
			packageId,
			userId,
			benificiaryUserId,
			refDocId,
			payeeType,
			paymentMethodId,
			isParticipant,
			paymentType,
			paymentId,
			amount,
			paymentBy
		} = kafkaPurchaseInititateDto;
		if (
			!packageId ||
			!userId ||
			!benificiaryUserId ||
			!paymentMethodId ||
			!paymentType ||
			!paymentId ||
			!amount ||
			!paymentBy ||
			!Object.keys(PackagePaymentByEnum).includes(paymentBy)
		) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		if (paymentBy === PackagePaymentByEnum.SELF) {
			if (!isParticipant || !Object.keys(YesNoEnum).includes(isParticipant)) {
				throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
			}
			if (isParticipant === YesNoEnum.YES) {
				this.checkIsParticipantKafkaData(userId, refDocId);
			}
		} else if (!Object.keys(InviteeTypeEnum).includes(payeeType) || !refDocId) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
	}

	async checkIsParticipantKafkaData(userId: number, refDocId: number) {
		if (!refDocId) {
			throw new HttpException({ status: ResponseData.INVALID_REFDOC_ID }, HttpStatus.OK);
		}
		let refdocParticipantData = await this.docDaoService.getRefdocParticipantDataByUser(refDocId, userId, Status.ACTIVE);
		if (refdocParticipantData.cbReportingAllowed === isPrimary.Y || refdocParticipantData.isPrimary === isPrimary.Y) {
			throw new HttpException({ status: ResponseData.INVALID_REFDOC_ID }, HttpStatus.OK);
		}
	}

	async getPaymentHistoryData(request: any) {
		const { userid, systemUserId, usertoken, channelId } = request.headers;
		const paymentHistoryData = await this.packageDaoService.getPaymentHistoryData(userid);
		const paymentMethodIds = paymentHistoryData?.map((data) => data?.paymentMethodId);
		const configs = await this.configurationService.getChannelConfigurations(channelId);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT) || "MM-DD-YYYY";
		paymentHistoryData.forEach((data) => {
			data.renewalMonth = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				data?.renewalMonth?.toString(),
				dateFormat
			);
			if (!data.addressOne) {
				data.addressOne = data.addressOneB;
			}
			if (!data.addressTwo) {
				data.addressTwo = data.addressTwoB;
			}
			if (!data.city) {
				data.city = data.cityB;
			}
			if (!data.state) {
				data.state = data.stateB;
			}
			if (!data.zip) {
				data.zip = data.zipB;
			}
		});

		const url = this.externalUrlsService.cashierCardDetailsUrl;
		const headers = {
			accept: "*/*",
			userId: systemUserId,
			userToken: usertoken,
			"Content-Type": "application/json",
			aliasName: "www.cryr.com"
		};
		const data = {
			aliasName: "www.cryr.com",
			consumerId: systemUserId,
			consumerToken: usertoken,
			providerAccIds: paymentMethodIds
		};

		const cardDetails = await this.externalApiCallService.postReq(headers, data, url);
		if (cardDetails?.errorCode != 0) {
			throw new HttpException(
				{ status: { errorCode: cardDetails?.errorCode, errorMessage: cardDetails?.errorMessage } },
				HttpStatus.OK
			);
		}

		const cardDetailsObject = {};
		cardDetails?.data?.forEach((cardData) => {
			cardDetailsObject[cardData?.providerAccId] = { ...cardData };
		});

		const refdocDetailsObject = {};
		const refdocIds = paymentHistoryData.map((data) => data?.refdocId);
		const refdocsdata = await this.docDaoService.getRefdocDataByRefdocIds(refdocIds);
		refdocsdata.forEach((refdocData) => (refdocDetailsObject[refdocData.refdocId] = refdocData.documentPath));
		const subscriptionData = paymentHistoryData?.map((data) => ({
			...data,
			cardDetails: cardDetailsObject?.[data?.paymentMethodId],
			refdocDetails: refdocDetailsObject?.[data?.refdocId]
		}));

		return subscriptionData;
	}

	async createEmptyRefdoc(userId: number, refdocTypeId: number, packageId: number, queryRunner: QueryRunner) {
		const refdocMasterDto: RefdocMaster = new RefdocMaster(
			userId,
			refdocTypeId,
			null,
			null,
			null,
			RefdocMasterStatusEnum.REFDOC_UPLOAD_PENDING
		);
		refdocMasterDto.documentPresent = YNStatusEnum.YES;
		refdocMasterDto.buisnessType = BuisnessTypeEnum.B2C;
		const refdoc = await this.docDaoService.saveRefdocMasterByQueryRunner(refdocMasterDto, queryRunner);

		const refdocTypeData = await this.packageDaoService.getRefdocTypeByPackageId(packageId);
		const displayRefdocId = this.commonUtilityService.createDisplayRefdocId(
			refdoc.refdocId,
			refdoc.documentPresent,
			refdoc.buisnessType,
			refdocTypeData
		);
		const refdocData = await this.docDaoService.getRefdocByQueryRunner(queryRunner, refdoc.refdocId);
		refdocData.displayRefdocId = displayRefdocId;
		const refdocWithDisplayId = await this.docDaoService.saveRefdocMasterByQueryRunner(refdocData, queryRunner);
		return refdocWithDisplayId.refdocId;
	}

	async modifyPackagePurchaseFromUser(
		kafkaPurchaseInititateDto: KafkaPurchaseInititateDto,
		userInfo: UserMasterEntity,
		packageData: PackageMaster
	) {
		let { packageId, refDocId, paymentMethodId, paymentType, paymentId, amount } = kafkaPurchaseInititateDto;
		const userId = userInfo.userId;
		const benificiaryUserId = kafkaPurchaseInititateDto.benificiaryUserId;
		let lastTxn = await this.packageDaoService.getUsersLastValidTill(
			benificiaryUserId,
			packageId,
			refDocId,
			PaymentStatusEnum.PAYMENT_DONE
		);
		let renewalDate = this.commonUtilityService.getPackageRenewalDate(1);
		let validTill = this.getLastDateOfMonth(1);
		let { month, year } = this.commonUtilityService.getMonthAndYearFromDate(new Date());
		if (lastTxn) {
			let months = this.commonUtilityService.getNumberOfMonthsBetweenDates(new Date(), lastTxn.lastRenewalMonth);
			renewalDate = this.commonUtilityService.getPackageRenewalDate(months + 1);
			validTill = this.getLastDateOfMonth(months + 1);
			const renewalData = this.commonUtilityService.getMonthAndYearFromDate(lastTxn.lastRenewalMonth);
			month = renewalData.month;
			year = renewalData.year;
		}
		refDocId = isNaN(parseInt(refDocId?.toString())) ? null : refDocId;
		let newSubscriptionTxn: UserSubscriptionTransactions = new UserSubscriptionTransactions(
			packageId,
			userId,
			benificiaryUserId,
			new Date(renewalDate),
			true,
			packageData.firstUnitPrice,
			+amount
		);
		newSubscriptionTxn.addSubscriptionTransactionDetails(
			validTill,
			PaymentStatusEnum.PAYMENT_DONE,
			refDocId || null,
			paymentType,
			paymentMethodId,
			paymentId.toString()
		);
		newSubscriptionTxn.updateSubscriptionMonthAndYear(MonthMapEnum[month], year);
		newSubscriptionTxn.setFirstSubscription(YesNoEnum.NO);
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			const purchaseTxn = await this.packageDaoService.createUserSubscriptionTxnByQueryRunner(
				newSubscriptionTxn,
				queryRunner
			);
			await this.packageDaoService.updateUserSubcriptionAutoRenewalQueryRunner(
				benificiaryUserId,
				refDocId,
				purchaseTxn.id,
				false,
				queryRunner
			);
			await this.handleRefdocUsersEntry(refDocId, userId, queryRunner, benificiaryUserId);
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	async getPaymentId(getPaymentIdDto: GetPaymentIdDto, request: any) {
		const { refdocId } = getPaymentIdDto;
		const { userid } = request.headers;
		if (!refdocId) {
			throw new HttpException({ status: ResponseData.INVALID_REFDOC_ID }, HttpStatus.OK);
		}
		return await this.packageDaoService.getPaymentIdByRefdocIdAndBenificiaryUserId(userid, refdocId);
	}

	async cancelSubscription(cancelSubscriptionDto: CancelSubscriptionDto, request: any) {
		const { refdocId } = cancelSubscriptionDto;
		const userInfo = request[VariablesConstant.USER_DETAIL_MODEL];
		const { userId } = userInfo;
		const activeSubscriptions = await this.packageDaoService.getPaymentIdByRefdocIdBenificiaryUserIdAndAutoRenewal(
			userId,
			refdocId,
			true
		);
		activeSubscriptions.forEach((subscription) => {
			subscription.autoRenewal = false;
			subscription.updatedAt = new Date();
		});
		await this.packageDaoService.saveUserSubscriptionTxn(activeSubscriptions);
	}
}
