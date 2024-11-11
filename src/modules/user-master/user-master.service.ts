import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CommonUtilityService } from "src/utils/common/common-utility/common-utility.service";
import { ResponseData } from "src/utils/enums/response";
import { UserStatusEnum, UserType } from "src/utils/enums/user-types";
import { ConfigurationService } from "../../utils/configuration/configuration.service";
import { UserDaoService } from "../dao/user-dao/user-dao.service";
import { UpdateUserReq } from "./dto/update-user-request.dto";
import { UserChannelMappingRequest } from "./dto/user-channel-mapping-request.dto";
import { UserRegistrationRequest } from "./dto/user-registration-request.dto";
import { UserChannelMapping } from "./entities/user-channel-mapping.entity";
import { UserHelperService } from "./user-helper/user-helper.service";
import {
	DisplayYesNoEnum,
	InviteeTypeEnum,
	RequestStatusEnum,
	Status,
	UserProfileStatusEnum,
	YNStatusEnum
} from "src/utils/enums/Status";
import { BusinessDaoService } from "../dao/business-dao/business-dao.service";
import { ChannelDaoService } from "../dao/channel-dao/channel-dao.service";
import { AliasDaoService } from "../dao/alias-dao/alias-dao.service";
import { UserProfileProgress } from "./entities/user-profile-progress-status.entity";
import { ParticipantDaoService } from "@modules/dao/participant-dao/participant-dao.service";
import { UserMasterEntity } from "./entities/user-master.entity";
import { GetUserProfileStatusDto } from "./dto/get-user-profile.dto";
import { UpdateUserProfileStatusDto } from "./dto/update-profile-status.dto";
import { PackageDaoService } from "@modules/dao/package-dao/package-dao.service";
import { Request } from "express";
import { UserSearchinfoDto } from "./dto/user-search-info-dto";
import { GetUserInfo } from "./dto/get-user-info.dto";
import { DocDaoService } from "@modules/dao/doc-dao/doc-dao.service";
import VariablesConstant from "@utils/variables-constant";
import { ConfigCodeEnum } from "@utils/enums/constants";
import { BackOfficePermissionsDto } from "./dto/back-office-permission-dto";
import { DataSource, QueryRunner } from "typeorm";
import { UpdateBackOfficePermissionDto } from "./dto/update-backoffice-permission-dto";
import { PiiDataPermissions } from "./entities/pii-data-permissions.entity";
import { ExternalUrlsService } from "@utils/constants/urls";
import { ExternalApiCallService } from "@utils/common/external-api-call/external-api-call.service";
import { UpdateConsumerProfileDto } from "./dto/update-consumer-profile-dto";
import { ConfigService } from "src/config";
const FormData = require("form-data");

@Injectable()
export class UserMasterService {
	constructor(
		private userDao: UserDaoService,
		private configurationService: ConfigurationService,
		private userHelper: UserHelperService,
		private businessMasterDao: BusinessDaoService,
		private channelDao: ChannelDaoService,
		private aliasDao: AliasDaoService,
		private readonly participantDaoService: ParticipantDaoService,
		private readonly commonUtilityService: CommonUtilityService,
		private readonly packageDaoService: PackageDaoService,
		private readonly docDaoService: DocDaoService,
		private readonly dataSource: DataSource,
		private readonly externalUrlsService: ExternalUrlsService,
		private readonly externalApiCallService: ExternalApiCallService,
		private readonly configService: ConfigService
	) {}

	async registerUser(userRegistrationRequest: UserRegistrationRequest) {
		await this.businessMasterDao.findByBusinessIdAndStatus(userRegistrationRequest.businessId, Status.ACTIVE);
		let aliasMaster = null;
		let channelId = 0;
		let ssnVerified = YNStatusEnum.NO;
		let configurations = await this.configurationService.getBusinessConfigurations(userRegistrationRequest.businessId);
		if (userRegistrationRequest?.aliasName) {
			aliasMaster = await this.aliasDao.findByNameAndStatus(userRegistrationRequest.aliasName, Status.ACTIVE);
			channelId = aliasMaster.channelId;
		} else if (userRegistrationRequest.channelId !== 0) {
			const channelMaster = await this.channelDao.findByBusinessIdAndChannelIdAndStatus(
				userRegistrationRequest.businessId,
				userRegistrationRequest.channelId,
				Status.ACTIVE
			);
			channelId = channelMaster.channelId;
			configurations = await this.configurationService.getChannelConfigurations(
				channelId,
				channelMaster?.channelType?.toString()
			);
		}
		this.userHelper.checkUserRegistrationRequest(userRegistrationRequest, configurations, channelId);
		const countryStateCityNameMap = await this.userHelper.validateCityStateAndCountry(
			userRegistrationRequest.stateCode,
			userRegistrationRequest.countryCode
		);
		userRegistrationRequest.state = countryStateCityNameMap.get("state");
		userRegistrationRequest.country = countryStateCityNameMap.get("country");

		if (UserType[userRegistrationRequest.userType] === UserType.CONSUMER.toString()) {
			if (!userRegistrationRequest.aliasId && !aliasMaster) {
				throw new HttpException({ status: ResponseData["INVALID_ALIAS"] }, HttpStatus.OK);
			}

			if (!aliasMaster) {
				aliasMaster = await this.aliasDao.findByChannelIdAndAliasIdAndStatus(
					channelId,
					userRegistrationRequest.aliasId,
					Status.ACTIVE
				);
			}
			if (userRegistrationRequest?.primaryIdValue) {
				await this.userDao.existByPrimaryIdValue(userRegistrationRequest.primaryIdValue);
				ssnVerified = YNStatusEnum.YES;
			}
		}
		await this.userDao.existsByBusinessIdAndChannelIdAndSystemUserIdAndUserType(
			userRegistrationRequest.businessId,
			channelId,
			userRegistrationRequest.systemUserId,
			UserType[userRegistrationRequest.userType]
		);
		if (userRegistrationRequest.dateOfBirth) {
			userRegistrationRequest.dateOfBirth = new Date(userRegistrationRequest.dateOfBirth);
		}
		let userInfo = {
			...userRegistrationRequest,
			channelId,
			aliasId: aliasMaster == null ? 0 : aliasMaster.aliasId
		};
		userInfo["city"] = userRegistrationRequest.cityName;
		userInfo["ssn"] = userRegistrationRequest.primaryIdValue;
		userInfo["ssnVerified"] = ssnVerified;
		userInfo["refDocParticipant"] = YNStatusEnum.NO;
		userInfo["payDocParticipant"] = YNStatusEnum.NO;
		userInfo["veriDocParticipant"] = YNStatusEnum.NO;
		userInfo.createdAt = new Date();
		userInfo.updatedAt = new Date();
		userInfo.zip = userRegistrationRequest.zipCode;
		userInfo.status = Status.ACTIVE;
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			userInfo = await this.userDao.saveUserInfoByQueryRunner(userInfo, queryRunner);
			if (UserType[userRegistrationRequest.userType] === UserType.CONSUMER.toString()) {
				await this.userHelper.updateParticipantUserId(queryRunner, userInfo);
				await this.updateUserProfileStatus(userInfo, queryRunner);
			} else {
				await this.savePiiDataPermissionsForUserType(userRegistrationRequest, userInfo, queryRunner);
			}
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
		return userInfo;
	}

	async savePiiDataPermissionsForUserType(
		userRegistrationRequest: UserRegistrationRequest,
		userInfo,
		queryRunner: QueryRunner
	) {
		let piiDataPermission;
		if (UserType[userRegistrationRequest.userType] === UserType.BO) {
			piiDataPermission = new PiiDataPermissions(userInfo.userId, YNStatusEnum.NO, YNStatusEnum.NO, YNStatusEnum.NO);
		} else if (UserType[userRegistrationRequest.userType] === UserType.SUPER_BO) {
			piiDataPermission = new PiiDataPermissions(
				userRegistrationRequest.userId,
				YNStatusEnum.YES,
				YNStatusEnum.YES,
				YNStatusEnum.YES
			);
		}
		await this.userDao.savePiiDataPermissions(piiDataPermission, queryRunner);
	}

	async updateUser(updateUserReq: UpdateUserReq) {
		this.businessMasterDao.findByBusinessIdAndStatus(updateUserReq.businessId, Status.ACTIVE);
		let channelId = 0;
		let businessConfig = await this.configurationService.getBusinessConfigurations(updateUserReq.businessId);
		if (updateUserReq.channelId !== 0) {
			const channelMaster = await this.channelDao.findByBusinessIdAndChannelIdAndStatus(
				updateUserReq.businessId,
				updateUserReq.channelId,
				Status.ACTIVE
			);
			channelId = channelMaster.channelId;
			businessConfig = await this.configurationService.getChannelConfigurations(
				channelId,
				channelMaster.channelType.toString()
			);
		}

		let userInfo = await this.userDao.findByBusinessIdAndChannelIdAndSystemUserIdAndUserType(
			updateUserReq.businessId,
			channelId,
			updateUserReq.systemUserId,
			UserType[updateUserReq.userType]
		);
		if (updateUserReq.emailId && userInfo.emailId !== updateUserReq.emailId) {
			CommonUtilityService.isEmailValid(businessConfig.get("EMAIL_REGEX"), updateUserReq.emailId);
			await this.userDao.existsByBusinessIdAndChannelIdAndEmailIdFromUserInfo(
				updateUserReq.businessId,
				channelId,
				updateUserReq.emailId,
				UserType[updateUserReq.userType]
			);
		}
		if (updateUserReq.mobileNo && userInfo.mobileNo !== updateUserReq.mobileNo) {
			if (!updateUserReq.mobileCode) {
				throw new HttpException({ status: ResponseData.INVALID_MOBILE_CODE }, HttpStatus.OK);
			}
			CommonUtilityService.isMobileValid(
				businessConfig.get("MOBILE_REGEX"),
				updateUserReq.mobileCode + updateUserReq.mobileNo
			);
			await this.userDao.existsByBusinessIdAndChannelIdAndMobileCodeAndMobileNoAndUserType(
				updateUserReq.businessId,
				channelId,
				updateUserReq.mobileCode,
				updateUserReq.mobileNo,
				UserType[updateUserReq.userType]
			);
		}
		if (updateUserReq.username && userInfo.username !== updateUserReq.username) {
			await this.userDao.existsByBusinessIdAndChannelIdAndUsernameFromUserInfo(
				updateUserReq.businessId,
				channelId,
				updateUserReq.username,
				UserType[updateUserReq.userType]
			);
		}
		if (updateUserReq.userStatus) {
			updateUserReq["status"] = Status[updateUserReq.userStatus];
		}
		if (updateUserReq.dateOfBirth) {
			updateUserReq.dateOfBirth = new Date(updateUserReq.dateOfBirth);
		}

		if (updateUserReq?.primaryIdValue) {
			userInfo.ssn = updateUserReq.primaryIdValue;
		}

		userInfo = {
			...userInfo,
			...updateUserReq,
			channelId,
			aliasId: userInfo.aliasId
		};

		const countryStateCityNameMap = await this.userHelper.validateCityStateAndCountry(
			updateUserReq.stateCode,
			updateUserReq.countryCode
		);
		userInfo.state = countryStateCityNameMap.get("state");
		userInfo.country = countryStateCityNameMap.get("country");
		userInfo["city"] = updateUserReq.cityName;
		userInfo.zip = updateUserReq.zipCode;
		userInfo.updatedAt = new Date();
		userInfo = await this.userDao.save(userInfo);
		return userInfo;
	}

	async getUserTypes(businessId: number, request) {
		const userDetailModel = request.userDetailModel;
		this.configurationService.validateBusinessChannelCheck(userDetailModel, businessId, null);

		const businessConfig = await this.configurationService.getBusinessConfigurations(businessId);

		const enumList = UserType;
		const listOfAllowedUserType = businessConfig.get("ALLOWED_USER_TYPES").split(",");
		const respMap = {};
		for (let type in enumList) {
			if (listOfAllowedUserType.includes(type)) {
				respMap[type] = UserType[type];
			}
		}
		return respMap;
	}

	async userChannelMapping(reqBean: UserChannelMappingRequest) {
		await this.businessMasterDao.findByBusinessIdAndStatus(reqBean.businessId, Status.ACTIVE);
		const channelIdStatusMap = reqBean.channelIdsAndStatus;
		const channelIds = Array.from(new Set(Object.keys(channelIdStatusMap)));
		const validatedChannelList = await this.channelDao.findByBusinessIdAndStatusAndChannelIdIn(
			reqBean.businessId,
			Status.ACTIVE,
			channelIds
		);
		if (channelIds?.length !== validatedChannelList?.length) {
			throw new HttpException({ status: ResponseData["INVALID_CHANNEL_FOUND"] }, HttpStatus.OK);
		}
		const userInfo = await this.userDao.findByBusinessIdAndChannelIdAndSystemUserIdAndUserType(
			reqBean.businessId,
			0,
			reqBean.systemUserId,
			UserType[reqBean.userType]
		);
		const statusSet = new Set(Object.values(channelIdStatusMap));
		const validStatus = new Set([0, 1]);
		if ([...statusSet].some((status: any) => !validStatus.has(status))) {
			throw new HttpException({ status: ResponseData["INVALID_STATUS"] }, HttpStatus.OK);
		}
		const existUserChannelMappingList = await this.channelDao.findUserChannelsByUserId(userInfo.userId);
		const existUserChannelMappingMap = new Map();

		existUserChannelMappingList.forEach((obj) => existUserChannelMappingMap.set(obj.userId + "_" + obj.channelId, obj));

		const userChannelMappingList = new Array();

		channelIds.forEach((obj) => {
			let userChannelMapping = null;
			if (!existUserChannelMappingMap.get(userInfo.userId + "_" + obj)) {
				userChannelMapping = new UserChannelMapping(userInfo.userId, +obj, channelIdStatusMap[obj]);
			} else {
				userChannelMapping = existUserChannelMappingMap.get(userInfo.userId + "_" + obj);
				userChannelMapping.status = channelIdStatusMap[obj];
				userChannelMapping.updatedAt = new Date();
			}
			userChannelMappingList.push(userChannelMapping);
		});

		if (!userChannelMappingList?.length) {
			throw new HttpException({ status: ResponseData["DATA_NOT_FOUND"] }, HttpStatus.OK);
		}

		await this.channelDao.saveAll([...userChannelMappingList]);
		return userChannelMappingList;
	}

	async updateUserProfileStatus(userInfo: UserRegistrationRequest, queryRunner: QueryRunner) {
		let { userId, inviteCode } = userInfo;
		if (!userInfo.inviteCode) {
			//normal registration
			let userProfileProgressMasterEntity: UserProfileProgress = new UserProfileProgress(
				userId,
				UserProfileStatusEnum.SUBSCRIPTION_PENDING,
				null,
				null
			);
			return await this.userDao.addUserProfileDataByQueryRunner(userProfileProgressMasterEntity, queryRunner);
		}
		let invitedUserInfo =
			(await this.participantDaoService.getRequestedParticipantData(inviteCode, RequestStatusEnum.REQUESTED)) ||
			(await this.participantDaoService.getPaymentRequestedParticipantData(inviteCode, RequestStatusEnum.REQUESTED));
		if (invitedUserInfo) {
			let userProfileProgressMasterEntity: UserProfileProgress = new UserProfileProgress(
				userId,
				invitedUserInfo.inviteeType === InviteeTypeEnum.PARTICIPANT
					? UserProfileStatusEnum.INVITED_LEASE_DATA_PENDING
					: UserProfileStatusEnum.INVITED_PLAID_PENDING,
				JSON.stringify(invitedUserInfo),
				invitedUserInfo?.refdocId
			);
			return await this.userDao.addUserProfileDataByQueryRunner(userProfileProgressMasterEntity, queryRunner);
		}
	}

	async getUserProfileStatus(getUserProfileStatusDto: GetUserProfileStatusDto, request: any) {
		let { userid, systemUserId } = request.headers;
		let { refdocId } = getUserProfileStatusDto;
		if (refdocId && !Number.isInteger(+refdocId)) {
			throw new HttpException({ status: ResponseData.INVALID_REFDOC_ID }, HttpStatus.OK);
		}
		refdocId = isNaN(refdocId) ? null : refdocId;
		let userProfileStatus = await this.userDao.getUserProfileDataForRefdoc(userid, refdocId);
		if (!userProfileStatus) {
			userProfileStatus = {
				profileStageCode: UserProfileStatusEnum.HOME,
				id: null,
				userId: systemUserId,
				refdocId: refdocId,
				createdAt: null,
				updatedAt: null,
				data: JSON.parse("{}")
			};
		} else {
			userProfileStatus.userId = systemUserId;
			userProfileStatus.data = JSON.parse(userProfileStatus?.data);
		}
		return userProfileStatus;
	}

	async updateMinimalUserProfileStatusToFull(userData: UserMasterEntity) {
		let { userId } = userData;
		let userProfileStatus = await this.userDao.getUserProfileDataByStatusAndRefdoc(
			userId,
			UserProfileStatusEnum.INVITED_HOME,
			null
		);
		if (userProfileStatus) {
			await this.userDao.updateUserProfileData(userId, UserProfileStatusEnum.SUBSCRIPTION_PENDING, null);
		}
	}

	async updateUserProfileStatusCode(updateUserProfileStatusDto: UpdateUserProfileStatusDto, request: any) {
		let { userid } = request.headers;
		let refdocId = updateUserProfileStatusDto?.refdocId;
		const userProfileStatus = await this.userDao.getUserProfileDataForRefdoc(userid, null);
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			if (userProfileStatus) {
				await this.commonUtilityService.updateUserProfileStatus(
					userid,
					UserProfileStatusEnum.PLAID_PENDING,
					UserProfileStatusEnum.HOME,
					null,
					refdocId,
					queryRunner,
					userProfileStatus
				);
			} else {
				await this.commonUtilityService.updateUserProfileStatus(
					userid,
					UserProfileStatusEnum.PLAID_PENDING,
					UserProfileStatusEnum.HOME,
					null,
					refdocId,
					queryRunner
				);
			}
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	async getUserStatus(request: Request) {
		const { userid } = request.headers;
		const userInfo = await this.userDao.getUserInfoByUserId(+userid);
		if (!userInfo) {
			throw new HttpException({ status: ResponseData.INVALID_USER_ID }, HttpStatus.OK);
		}
		return userInfo?.primaryIdValue ? UserStatusEnum.FULL_USER : UserStatusEnum.HALF_USER;
	}

	async getUserSearchInfo(body: UserSearchinfoDto, request: any) {
		let { refdocId, registrationFrom, registrationTill } = body;
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const configs = await this.configurationService.getBusinessConfigurations(userDetailModel?.businessId);
		const refdocUsersData = await this.docDaoService.getRefdocUsersDataByRefdocId(refdocId);
		const userIdsArr = [];
		if (refdocId && !refdocUsersData.length) {
			throw new HttpException({ status: ResponseData.USER_NOT_FOUND }, HttpStatus.OK);
		}
		refdocUsersData.forEach((refdocUsers) => {
			if (refdocUsers.tenantId && !userIdsArr.includes(refdocUsers.tenantId)) {
				userIdsArr.push(refdocUsers.tenantId);
			}
			if (refdocUsers.paydocUserId && !userIdsArr.includes(refdocUsers.paydocUserId)) {
				userIdsArr.push(refdocUsers.paydocUserId);
			}
			if (refdocUsers.veridocUserId && !userIdsArr.includes(refdocUsers.veridocUserId)) {
				userIdsArr.push(refdocUsers.veridocUserId);
			}
		});
		let newRegistrationFrom, newRegistrationTill;
		if (registrationFrom) {
			registrationFrom = new Date(registrationFrom);
			registrationFrom.setSeconds(0);
			registrationFrom.setMinutes(0);
			registrationFrom.setHours(0);
			newRegistrationFrom = CommonUtilityService.getModifiedDate(registrationFrom);
		}
		if (registrationTill) {
			registrationTill = new Date(registrationTill);
			registrationTill.setSeconds(59);
			registrationTill.setMinutes(59);
			registrationTill.setHours(23);
			newRegistrationTill = CommonUtilityService.getModifiedDate(registrationTill);
		}
		const users = await this.userDao.getUserSearchInfo(body, userIdsArr, newRegistrationFrom, newRegistrationTill);
		await this.userHelper.formatUsersSearchData(configs, users.userData, userDetailModel?.userId);
		return users;
	}

	async getUserInfo(getUserInfoDto: GetUserInfo, request: any) {
		const { userId } = getUserInfoDto;
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const userType = getUserInfoDto.userType || UserType.CONSUMER;
		const userInfo = await this.userHelper.getUserInfo(userId, userType);
		const configs = await this.configurationService.getChannelConfigurations(userInfo.channelId);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT) || "MM-DD-YYYY";
		const dateTimeFormat = configs.get(ConfigCodeEnum.DEFAULT_DATETIME_FORMAT) || "MM-DD-YYYY HH:mm:ss";
		const userJourney = {
			userRegistration: userInfo.createdAt,
			stripeSubscription: null,
			refdocUpload: null,
			refdocVerification: null
		};
		const refdocs = await this.docDaoService.getRefdocParticipantsDataByUserId(userId);
		const refdocIdsArr = [];
		refdocs.forEach((refdoc) => {
			if (!refdocIdsArr.includes(refdoc.refdocId)) {
				refdocIdsArr.push(refdoc.refdocId);
			}
		});
		const primaryRefdocs = [];
		const refdocIdToRefdocMapping = await this.userHelper.getRefdocIdToRefdocMapping(
			refdocs,
			dateFormat,
			userJourney,
			userInfo,
			primaryRefdocs
		);
		if (refdocIdsArr.length) {
			const refdocUsersData = await this.userHelper.getUserInfoOfRefdocUsers(refdocIdsArr);
			Object.keys(refdocUsersData).forEach((refdocUsersKey) => {
				refdocIdToRefdocMapping[refdocUsersKey] = {
					...refdocIdToRefdocMapping[refdocUsersKey],
					refdocUsers: refdocUsersData[refdocUsersKey]
				};
			});
		}
		await this.userHelper.fomatUserInfo(userInfo, dateTimeFormat, dateFormat, userDetailModel?.userId);
		const masterProofs = await this.docDaoService.getUserMasterProofsByRefdocIds(primaryRefdocs, userId);
		masterProofs.forEach((masterProof) => {
			const refdoc = refdocIdToRefdocMapping[masterProof.refdocId];
			if (!refdoc["paymentModeSelected"] || refdoc["paymentModeSelected"] > masterProof.createdAt) {
				refdoc["paymentModeSelected"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
					masterProof.createdAt,
					dateFormat
				);
			}
		});
		const subscriptionsData = await this.packageDaoService.getUserSubscriptionsByRefdocIds(userId, primaryRefdocs);
		subscriptionsData.forEach((subscription) => {
			const refdoc = refdocIdToRefdocMapping[subscription.refdocId];
			if (!refdoc["subscriptionDate"] || refdoc["subscriptionDate"] > subscription.createdAt) {
				refdoc["subscriptionDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
					subscription.createdAt,
					dateFormat
				);
			}
			if (!userJourney.stripeSubscription || userJourney.stripeSubscription > subscription.createdAt)
				userJourney.stripeSubscription = subscription.createdAt;
		});
		const refdocDetails = Object.values(refdocIdToRefdocMapping);

		userJourney.refdocUpload = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			userJourney.refdocUpload,
			dateFormat
		);
		userJourney.refdocVerification = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			userJourney.refdocVerification,
			dateFormat
		);
		userJourney.stripeSubscription = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			userJourney.stripeSubscription,
			dateFormat
		);
		userJourney.userRegistration = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			userJourney.userRegistration,
			dateFormat
		);
		return { userInfo, refdocDetails, userJourney };
	}

	async getBackOfficeUserPermissions(body: BackOfficePermissionsDto) {
		const users = await this.userDao.getBackOfficeUserPermissionsInfo(body);
		users.userData.forEach((userData) => {
			userData.name = this.commonUtilityService.capitalizeWords(userData.name);
			userData.ssn = userData.ssn === YNStatusEnum.YES ? DisplayYesNoEnum.YES : DisplayYesNoEnum.NO;
			userData.email = userData.email === YNStatusEnum.YES ? DisplayYesNoEnum.YES : DisplayYesNoEnum.NO;
			userData.phone = userData.phone === YNStatusEnum.YES ? DisplayYesNoEnum.YES : DisplayYesNoEnum.NO;
		});
		return users;
	}

	async updateBackOfficeUserPermissions(body: UpdateBackOfficePermissionDto, request: any) {
		const { userPermissionData } = body;
		const userDetailModel = request.userDetailModel;
		const userPermissionsDataObj = {};
		const useridsArr = userPermissionData.map((permissionData) => {
			userPermissionsDataObj[permissionData.userId] = permissionData;
			return permissionData.userId;
		});
		const piiDataPermissions = await this.userDao.getPiiDataPermissions(useridsArr);
		piiDataPermissions.forEach((piiData) => {
			piiData.email =
				userPermissionsDataObj[piiData.userId].email == DisplayYesNoEnum.YES ? YNStatusEnum.YES : YNStatusEnum.NO;
			piiData.phone =
				userPermissionsDataObj[piiData.userId].phone == DisplayYesNoEnum.YES ? YNStatusEnum.YES : YNStatusEnum.NO;
			piiData.ssn =
				userPermissionsDataObj[piiData.userId].ssn == DisplayYesNoEnum.YES ? YNStatusEnum.YES : YNStatusEnum.NO;
			piiData.updatedDate = new Date();
			piiData.updateBy = userDetailModel?.userId;
		});

		await this.userDao.saveMultiplePiiDataPermissions(piiDataPermissions);
	}

	async updateConsumerProfile(updateConsumerProfileDto: UpdateConsumerProfileDto) {
		const headers = {
			clientCode: this.configService.get("CAM_CLIENT_CODE").toString(),
			clientPwd: this.configService.get("CAM_CLIENT_PASSWORD").toString()
		};
		const userInfo = await this.userDao.getUserInfoByUserId(updateConsumerProfileDto.systemConsumerId);
		const aliasName = await this.aliasDao.getAliasDataByAliasId(userInfo.aliasId);
		const formData = new FormData();
		if (aliasName?.name) {
			formData.append("aliasName", aliasName.name);
		}
		if (updateConsumerProfileDto?.addressLine1) {
			formData.append("addressLine1", updateConsumerProfileDto.addressLine1);
		}
		if (updateConsumerProfileDto?.addressLine2) {
			formData.append("addressLine2", updateConsumerProfileDto.addressLine2);
		}
		if (updateConsumerProfileDto?.countryCode) {
			formData.append("countryCode", updateConsumerProfileDto.countryCode);
		}
		if (userInfo.systemUserId) {
			formData.append("systemConsumerId", userInfo.systemUserId);
		}
		if (updateConsumerProfileDto?.stateCode) {
			formData.append("stateCode", updateConsumerProfileDto.stateCode);
		}
		if (updateConsumerProfileDto?.nationality) {
			formData.append("nationality", updateConsumerProfileDto.nationality);
		}
		if (updateConsumerProfileDto?.consumerStatus) {
			formData.append("consumerStatus", updateConsumerProfileDto.consumerStatus);
		}
		if (updateConsumerProfileDto?.city) {
			formData.append("city", updateConsumerProfileDto.city);
		}
		if (updateConsumerProfileDto?.zipCode) {
			formData.append("zipCode", updateConsumerProfileDto.zipCode);
		}
		if (userInfo.channelId) {
			formData.append("channelId", userInfo.channelId);
		}

		const url = this.externalUrlsService.updateConsumerProfileUrl;

		const response = await this.externalApiCallService.postReq(headers, formData, url);

		if (response?.errorCode) {
			throw new HttpException(response, HttpStatus.OK);
		}
		return response;
	}
}
