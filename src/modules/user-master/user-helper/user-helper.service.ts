import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { MasterDataDaoService } from "src/modules/dao/master-data-dao/master-data-dao.service";
import { ExternalApiCallService } from "src/utils/common/external-api-call/external-api-call.service";
import { Status, YNStatusEnum } from "src/utils/enums/Status";
import { ResponseData } from "src/utils/enums/response";
import VariablesConstant from "src/utils/variables-constant";
import { UserRegistrationRequest } from "../dto/user-registration-request.dto";
import { CommonUtilityService } from "@utils/common/common-utility/common-utility.service";
import { UserDaoService } from "@modules/dao/user-dao/user-dao.service";
import { UserType } from "@utils/enums/user-types";
import { CommonDaoService } from "@modules/dao/common-dao/common-dao.service";
import { ParticipantDaoService } from "@modules/dao/participant-dao/participant-dao.service";
import { QueryRunner } from "typeorm";
import { ConfigCodeEnum } from "@utils/enums/constants";
import { UserMasterEntity } from "../entities/user-master.entity";
import { isPrimary } from "@modules/doc/entities/refdoc-participants-master.entity";

@Injectable()
export class UserHelperService {
	constructor(
		private externalApiCallService: ExternalApiCallService,
		private masterDataDao: MasterDataDaoService,
		private userDao: UserDaoService,
		private commonDao: CommonDaoService,
		private participantDaoService: ParticipantDaoService,
		private readonly commonUtilityService: CommonUtilityService
	) {}

	async validateCityStateAndCountry(stateCode, countryCode) {
		const countryStateCityNameMap = new Map();
		if (countryCode) {
			const countryMaster = await this.masterDataDao.findByCountryCode(countryCode);
			countryStateCityNameMap.set("country", countryMaster?.name);
		}
		if (stateCode) {
			if (!countryCode) {
				throw new HttpException({ status: ResponseData.INVALID_COUNTRY_FOUND }, HttpStatus.OK);
			}
			const stateMaster = await this.masterDataDao.findByCountryCodeAndStateCodeAndStatus(countryCode, stateCode);
			countryStateCityNameMap.set("state", stateMaster?.name);
		}

		return countryStateCityNameMap;
	}

	async getResponseData(request, searchUserRequest, configList) {
		let url = "";
		const [systemUrls] = configList.filter((config) => config.configCode === VariablesConstant.INTER_SYSTEM_URLS);
		try {
			const configValues = JSON.parse(systemUrls.configValue);
			if (configValues["userSearch"][VariablesConstant.URL_DETAILS]) {
				url = configValues["userSearch"][VariablesConstant.URL_DETAILS]["url"];
			}
		} catch (e) {
			throw new HttpException({ status: ResponseData.URL_NOT_FOUND_ERROR_CODE }, HttpStatus.OK);
		}

		const authorizationHeader: string = request.headers["authorization"];

		if (!authorizationHeader?.startsWith("Bearer ")) {
			throw new HttpException({ status: ResponseData.INVALID_TOKEN }, HttpStatus.OK);
		}

		const headers = {
			"Content-Type": "application/json",
			Authorization: authorizationHeader
		};

		const userData = await this.externalApiCallService.postReq(headers, searchUserRequest, url);
		if (!userData.errorCode) {
			throw new Error(userData);
		}
		return userData;
	}

	async checkUserRegistrationRequest(
		userRegistrationRequest: UserRegistrationRequest,
		configurations: Map<string, string>,
		channelId: number
	) {
		if (userRegistrationRequest.emailId) {
			CommonUtilityService.isEmailValid(configurations.get("EMAIL_REGEX"), userRegistrationRequest.emailId);
			await this.userDao.existsByBusinessIdAndChannelIdAndEmailIdFromUserInfo(
				userRegistrationRequest.businessId,
				channelId,
				userRegistrationRequest.emailId,
				UserType[userRegistrationRequest.userType]
			);
		}
		if (userRegistrationRequest.username) {
			await this.userDao.existsByBusinessIdAndChannelIdAndUsernameFromUserInfo(
				userRegistrationRequest.businessId,
				channelId,
				userRegistrationRequest.username,
				UserType[userRegistrationRequest.userType]
			);
		}

		if (userRegistrationRequest.mobileNo) {
			if (!userRegistrationRequest.mobileCode) {
				throw new HttpException({ status: ResponseData["INVALID_MOBILE_CODE"] }, HttpStatus.OK);
			}
			CommonUtilityService.isMobileValid(
				configurations.get("MOBILE_REGEX"),
				`${userRegistrationRequest.mobileCode}${userRegistrationRequest.mobileNo}`
			);

			await this.userDao.existsByBusinessIdAndChannelIdAndMobileCodeAndMobileNoAndUserType(
				userRegistrationRequest.businessId,
				channelId,
				userRegistrationRequest.mobileCode,
				userRegistrationRequest.mobileNo,
				UserType[userRegistrationRequest.userType]
			);
		}

		if (userRegistrationRequest.currencyCode) {
			await this.commonDao.findByCurrencyCode(userRegistrationRequest.currencyCode);
		}
	}

	async getUserInfo(userId, userType: UserType) {
		if (!userId) {
			throw new HttpException({ status: ResponseData.INVALID_USER_ID_IN_REQUEST }, HttpStatus.OK);
		}
		const userInfo = await this.userDao.getUserInfoByUserIdAndUserType(userId, userType);
		if (!userInfo) {
			throw new HttpException({ status: ResponseData.INVALID_USER_ID_IN_REQUEST }, HttpStatus.OK);
		}

		userInfo.emailVerified = userInfo.emailVerified === YNStatusEnum.YES ? ("Yes" as any) : ("No" as any);
		userInfo.mobileVerified = userInfo.mobileVerified === YNStatusEnum.YES ? ("Yes" as any) : ("No" as any);
		userInfo.refDocParticipant = userInfo.refDocParticipant === YNStatusEnum.YES ? ("Yes" as any) : ("No" as any);
		userInfo.payDocParticipant = userInfo.payDocParticipant === YNStatusEnum.YES ? ("Yes" as any) : ("No" as any);
		userInfo.veriDocParticipant = userInfo.veriDocParticipant === YNStatusEnum.YES ? ("Yes" as any) : ("No" as any);
		userInfo.ssnVerified = userInfo.ssnVerified === YNStatusEnum.YES ? ("Yes" as any) : ("No" as any);
		return userInfo;
	}

	async updateParticipantUserId(queryRunner: QueryRunner, userInfo) {
		let userId = userInfo.userId;
		let emailId = userInfo?.emailId;
		let mobileNo = userInfo?.mobileNo;
		await this.participantDaoService.updateParticipantUserId(queryRunner, userId, emailId, mobileNo);

		await this.participantDaoService.updateInvitedPayeeUserId(queryRunner, userId, emailId, mobileNo);
	}

	async formatUsersSearchData(configs: Map<string, string>, usersData: any[], userId: number) {
		const { emailPermission, phonePermission } = await this.commonUtilityService.getPiiPermissionData(userId);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT) || "MM-DD-YYYY";
		usersData.forEach((userData) => {
			userData["name"] = this.commonUtilityService.capitalizeWords(userData["name"]);
			userData["mobileNo"] = this.commonUtilityService.formatMobileNumber(userData["mobileNo"], phonePermission);
			userData["emailId"] = this.commonUtilityService.formatEmail(userData["emailId"], emailPermission);
			userData["registrationDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				userData["registrationDate"],
				dateFormat
			);
		});
	}

	async getRefdocIdToRefdocMapping(
		refdocs: any[],
		dateFormat: string,
		userJourney,
		userInfo: UserMasterEntity,
		primaryRefdocs: any[]
	) {
		const stateCodeToNameMapping = await this.commonUtilityService.getStateCodeToNameMapping();
		return refdocs.reduce((refdocMapping, refdoc) => {
			refdoc["state"] = refdoc["state"] ? stateCodeToNameMapping[refdoc["state"]] : refdoc["state"];
			refdoc["paymentModeSelected"] = null;
			refdoc["subscriptionDate"] = null;
			refdoc["approvedDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				refdoc["approvedDate"],
				dateFormat
			);
			refdoc["uploadedDate"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				refdoc["uploadedDate"],
				dateFormat
			);
			refdoc["userRegistration"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				userInfo.createdAt,
				dateFormat
			);
			refdoc["verifiedAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				refdoc["verifiedAt"],
				dateFormat
			);
			refdocMapping[refdoc.refdocId] = refdoc;
			if (refdoc.isPrimary === isPrimary.Y) {
				primaryRefdocs.push(refdoc.refdocId);
				if (!userJourney.refdocUpload || userJourney.refdocUpload > refdoc.uploadedDate)
					userJourney.refdocUpload = refdoc.uploadedDate;
				if (!userJourney.refdocVerification || userJourney.refdocVerification > refdoc.approvedDate)
					userJourney.refdocVerification = refdoc.approvedDate;
			}
			return refdocMapping;
		}, {});
	}

	async fomatUserInfo(userInfo: UserMasterEntity, dateTimeFormat: string, dateFormat: string, userId: number) {
		const { emailPermission, phonePermission, ssnPermission } = await this.commonUtilityService.getPiiPermissionData(
			userId
		);
		userInfo.firstName = this.commonUtilityService.capitalizeWords(userInfo.firstName);
		userInfo.lastName = this.commonUtilityService.capitalizeWords(userInfo.lastName);
		userInfo.mobileNo = this.commonUtilityService.formatMobileNumber(userInfo.mobileNo, phonePermission);
		userInfo.emailId = this.commonUtilityService.formatEmail(userInfo.emailId, emailPermission);
		userInfo.primaryIdValue = this.commonUtilityService.formatSsn(userInfo.primaryIdValue, ssnPermission);
		userInfo.createdAt = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			userInfo.createdAt,
			dateTimeFormat
		);
		userInfo.dateOfBirth = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			userInfo.dateOfBirth,
			dateFormat
		);
	}

	async getUserInfoOfRefdocUsers(refdocIds: number[]) {
		const refdocUsersData = await this.userDao.getUserInfoOfRefdocUsersByRefdocIds(refdocIds);
		const refdocWiseUsersData = {};
		let tenantIdsTrackObj = {};
		let paydocIdsTrackObj = {};
		let veridocIdsTrackObj = {};
		refdocUsersData.forEach((refdocUsers) => {
			if (!Object.keys(refdocWiseUsersData).includes(refdocUsers.refdocId)) {
				refdocWiseUsersData[refdocUsers.refdocId] = [];
				tenantIdsTrackObj = {};
				paydocIdsTrackObj = {};
				veridocIdsTrackObj = {};
			}

			if (!Object.keys(tenantIdsTrackObj).includes(refdocUsers.tenantId)) {
				tenantIdsTrackObj[refdocUsers.tenantId] = refdocWiseUsersData[refdocUsers.refdocId].length;
				const refdocUserDataObj = { paydocData: [], veridocData: [] };
				refdocUserDataObj["tenantId"] = refdocUsers.tenantId;
				refdocUserDataObj["tenantName"] = this.commonUtilityService.capitalizeWords(refdocUsers.tenantUserName);
				refdocWiseUsersData[refdocUsers.refdocId].push(refdocUserDataObj);
			}

			if (!paydocIdsTrackObj[refdocUsers.tenantId]) {
				paydocIdsTrackObj[refdocUsers.tenantId] = [];
			}
			if (!paydocIdsTrackObj[refdocUsers.tenantId].includes(refdocUsers.paydocUserId)) {
				paydocIdsTrackObj[refdocUsers.tenantId].push(refdocUsers.paydocUserId);
				const paydocDataObj = {};
				paydocDataObj["paydocUserId"] = refdocUsers.paydocUserId;
				paydocDataObj["paydocName"] = this.commonUtilityService.capitalizeWords(refdocUsers.paydocUserName);
				refdocWiseUsersData[refdocUsers.refdocId][tenantIdsTrackObj[refdocUsers.tenantId]]["paydocData"].push(
					paydocDataObj
				);
			}
			if (!veridocIdsTrackObj[refdocUsers.tenantId]) {
				veridocIdsTrackObj[refdocUsers.tenantId] = [];
			}
			if (!veridocIdsTrackObj[refdocUsers.tenantId].includes(refdocUsers.veridocUserId)) {
				veridocIdsTrackObj[refdocUsers.tenantId].push(refdocUsers.veridocUserId);
				const veridocDataObj = {};
				veridocDataObj["veridocUserId"] = refdocUsers.veridocUserId;
				veridocDataObj["veridocName"] = this.commonUtilityService.capitalizeWords(refdocUsers.veridocUserName);
				refdocWiseUsersData[refdocUsers.refdocId][tenantIdsTrackObj[refdocUsers.tenantId]]["veridocData"].push(
					veridocDataObj
				);
			}
		});
		return refdocWiseUsersData;
	}
}
