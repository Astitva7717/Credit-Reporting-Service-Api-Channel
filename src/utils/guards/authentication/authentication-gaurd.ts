import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { ConfigurationService } from "src/utils/configuration/configuration.service";
import { ClientTokensEntity } from "src/modules/master-data/entities/client-token.entity";
import { UserType } from "src/utils/enums/user-types";
import VariablesConstant from "src/utils/variables-constant";
import { UserDaoService } from "src/modules/dao/user-dao/user-dao.service";
import { ResponseData } from "src/utils/enums/response";
import { BusinessDaoService } from "src/modules/dao/business-dao/business-dao.service";
import { Status, YesNoEnum } from "src/utils/enums/Status";
import { MongoBackofficeApis } from "src/modules/mongo/entities/MongoBackofficeApis";
import { ExternalApiCallService } from "src/utils/common/external-api-call/external-api-call.service";
import { MongoService } from "src/modules/mongo/mongo.service";
import * as fastify from "fastify";
import { MasterDataDaoService } from "@modules/dao/master-data-dao/master-data-dao.service";
import { CommonUtilityService } from "@utils/common/common-utility/common-utility.service";
import { AliasDaoService } from "@modules/dao/alias-dao/alias-dao.service";
import { AppLoggerService } from "src/app-logger/app-logger.service";
import { AppLoggerDto } from "@app-logger/app-logger.dto";
import { ConfigCodeEnum } from "@utils/enums/constants";

export enum API_REQUEST_TYPE {
	V1 = "/v1.0/",
	PRE_LOGIN = "/preLogin/",
	POST_LOGIN = "/postLogin/",
	CLIENT = "/client/",
	RESCHEDULE_ALLOWED = "/rescheduleAllowed/"
}

@Injectable()
export class AuthenticationGuard implements CanActivate {
	constructor(
		private userMasterDao: UserDaoService,
		private configurationService: ConfigurationService,
		private appLoggerService: AppLoggerService,
		private businessMasterDao: BusinessDaoService,
		private externalApiCallService: ExternalApiCallService,
		private mongoService: MongoService,
		private masterDataDao: MasterDataDaoService,
		private commonUtilityService: CommonUtilityService,
		private aliasDaoService: AliasDaoService
	) {}

	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const request = context.switchToHttp().getRequest();
		return this.validateBackOfficeEndpoint(request);
	}

	async getLoginData(request) {
		return await this.getResponseData(request, "getLoginData", null);
	}

	/**
	 * Validate BackOffice Endpoint
	 * @param request
	 * @returns
	 */
	async validateBackOfficeEndpoint(request: any): Promise<boolean> {
		if (request?.url?.includes(API_REQUEST_TYPE.V1)) {
			let userDetailModel: any = await this.getLoginData(request);
			if (userDetailModel?.errorCode === 0) {
				userDetailModel = userDetailModel.data;
				if (userDetailModel?.userTypeCode !== VariablesConstant.SUPER_BO) {
					await this.businessMasterDao.findByBusinessIdAndStatus(userDetailModel?.businessId, Status.ACTIVE);
				}
				const userType: UserType = userDetailModel?.userTypeCode;
				const userInfo = await this.userMasterDao.findByBusinessIdAndChannelIdAndSystemUserIdAndUserType(
					userDetailModel?.businessId,
					0,
					userDetailModel?.userId,
					UserType[userType]
				);

				if (!userInfo) {
					throw new HttpException({ status: ResponseData.INVALID_USER_FOUND }, HttpStatus.OK);
				}
				userDetailModel.userId = userInfo?.userId;
				request[VariablesConstant.USER_DETAIL_MODEL] = userDetailModel;
				return true;
			}
		} else if (request?.url?.includes(API_REQUEST_TYPE.PRE_LOGIN)) {
			return await this.validatePreLoginRequest(request);
		} else if (request?.url?.includes(API_REQUEST_TYPE.POST_LOGIN)) {
			return await this.validatePostLoginRequest(request);
		} else if (request?.url?.includes(API_REQUEST_TYPE.CLIENT)) {
			return await this.validateClientRequest(request);
		} else if (request?.url?.includes(API_REQUEST_TYPE.RESCHEDULE_ALLOWED)) {
			return await this.validateScheduleRequest(request);
		}
		return false;
	}

	/**
	 * Check Client IP
	 * @param clientTokens
	 * @param request
	 */
	clientIpCheck(clientTokens: ClientTokensEntity, request: any) {
		if (clientTokens?.clientIps) {
			const allowedIps = clientTokens.clientIps.split(",");
			const remoteIpAddress = request.connection.remoteAddress;
			const initiatedIpAddress: string = request.headers["X-FORWARDED-FOR"];
			if (!(allowedIps.includes(remoteIpAddress) || allowedIps.includes(initiatedIpAddress))) {
				const appLoggerDto: AppLoggerDto = new AppLoggerDto(
					VariablesConstant.WARNING,
					"invalid_system_ip_found",
					"filter_validation",
					"AuthenticationGuard",
					"clientIpCheck",
					null
				);
				appLoggerDto.addMethodAndRequest("", request);
				appLoggerDto.addData(
					"remoteIpAddress:" + remoteIpAddress,
					"initiatedIpAddress:" + initiatedIpAddress,
					"SystemAllowedIps:" + allowedIps
				);
				this.appLoggerService.writeLog(appLoggerDto);
				throw new HttpException({ status: ResponseData.IP_ADDRESS_MISSING }, HttpStatus.OK);
			}
		}
	}

	/**
	 * Get Response Data
	 * @param request
	 * @param url
	 * @param queryParam
	 * @returns
	 */
	async getResponseData(request: fastify.FastifyRequest, url: any, queryParam) {
		const configMap = await this.configurationService.getBusinessConfigurations(0);
		let type = url;
		try {
			const map = JSON.parse(configMap.get(VariablesConstant.INTER_SYSTEM_URLS));
			url = map[url][VariablesConstant.URL_DETAILS]["url"];
		} catch (e) {
			throw new HttpException({ status: ResponseData["URL_NOT_FOUND_ERROR_CODE"] }, HttpStatus.OK);
		}

		let authorizationHeader: string = request.headers["authorization"];
		if (!authorizationHeader?.startsWith("Bearer ")) {
			throw new HttpException({ status: ResponseData["INVALID_TOKEN"] }, HttpStatus.OK);
		}
		const isTokenFromBackOffice = JSON.parse(request.headers["backofficetoken"].toString());
		if (isTokenFromBackOffice) {
			authorizationHeader = this.configurationService.decryptBearerToken(authorizationHeader);
		}

		const headers = {
			"Content-Type": "application/json",
			Authorization: authorizationHeader
		};

		try {
			let mongoBackofficeApis: MongoBackofficeApis = null;
			if (`${process.env.IS_MONGO_ENABLE}` == "true") {
				mongoBackofficeApis = new MongoBackofficeApis(url, headers, queryParam, null, "UCM", type);
			}
			const loginData = await this.externalApiCallService.getReq(url, queryParam, headers);
			setImmediate(() => {
				this.mongoService.mongoLogging(
					url + queryParam,
					mongoBackofficeApis,
					VariablesConstant.MONGO_BACKOFFICE_APIS,
					loginData,
					new Date()
				);
			});
			if (loginData?.errorCode) {
				throw new HttpException(loginData, HttpStatus.OK);
			}
			return loginData;
		} catch (e) {
			throw new HttpException(e?.response, HttpStatus.OK);
		}
	}

	async validatePreLoginRequest(request: any) {
		const clientCode: string = request.headers[VariablesConstant.CLIENT_CODE];
		if (!clientCode) {
			throw new HttpException({ status: ResponseData.INVALID_CLIENT_CODE }, HttpStatus.OK);
		}
		const clientTokens = await this.masterDataDao.findByClientCodeAndStatus(clientCode, Status.ACTIVE);
		this.clientIpCheck(clientTokens, request);
		return true;
	}

	async validatePostLoginRequest(request: any) {
		const strUserId: string = request.headers["userid"];
		if (!strUserId) {
			throw new HttpException({ status: ResponseData.INVALID_USER_ID }, HttpStatus.OK);
		}
		const userToken: string = request.headers["usertoken"];
		if (!userToken) {
			throw new HttpException({ status: ResponseData.INVALID_USER_TOKEN }, HttpStatus.OK);
		}
		const aliasName: string = request.headers["aliasname"];
		if (!aliasName) {
			throw new HttpException({ status: ResponseData.INVALID_ALIAS }, HttpStatus.OK);
		}
		await this.commonUtilityService.checkLoginStatus(strUserId, userToken, aliasName, request.headers["actionType"]);
		let aliasData = await this.aliasDaoService.getAliasData(aliasName);
		let channelData = await this.aliasDaoService.getChannelData(aliasData.channelId);
		let businessId = channelData.businessId;
		let channelId = channelData.channelId;
		let userInfo = await this.userMasterDao.findByBusinessIdAndChannelIdAndSystemUserIdAndUserType(
			businessId,
			channelId,
			strUserId,
			UserType.CONSUMER
		);
		request[VariablesConstant.USER_DETAIL_MODEL] = userInfo;
		request.headers["systemUserId"] = strUserId;
		request.headers["userid"] = userInfo.userId;
		request.headers["businessId"] = businessId;
		request.headers["channelId"] = channelId;
		request.headers["aliasId"] = aliasData.aliasId;
		request.headers["aliasName"] = aliasData.name;
		return true;
	}

	async validateClientRequest(request: any) {
		const clientCode: string = request.headers[VariablesConstant.CLIENT_CODE];
		if (!clientCode) {
			throw new HttpException({ status: ResponseData.INVALID_CLIENT_CODE }, HttpStatus.OK);
		}
		const clientPwd: string = request.headers[VariablesConstant.CLIENT_CREDENTIAL];
		if (!clientPwd) {
			throw new HttpException({ status: ResponseData.INVALID_CLIENT_PWD }, HttpStatus.OK);
		}

		const clientTokens = await this.masterDataDao.findByClientCodeAndTokenAndStatus(
			clientCode,
			clientPwd,
			Status.ACTIVE
		);
		if (!clientTokens) {
			throw new HttpException({ status: ResponseData.INVALID_CLIENT_TOKENS }, HttpStatus.OK);
		}
		this.clientIpCheck(clientTokens, request);
		return true;
	}

	async validateScheduleRequest(request: any) {
		const businessId = 0;
		const configs = await this.configurationService.getBusinessConfigurations(businessId);
		const isRescheduleAllowed = configs.get(ConfigCodeEnum.RESCHEDULE_ALLOWED) || "NO";
		if (isRescheduleAllowed === YesNoEnum.NO) {
			return false; // not allpwed to proceed this option
		}
		return true;
	}
}
