import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ExternalApiCallService } from "src/utils/common/external-api-call/external-api-call.service";
import { ResponseData } from "src/utils/enums/response";
import VariablesConstant from "src/utils/variables-constant";
import { ConfigurationService } from "../../utils/configuration/configuration.service";
import { MongoBackofficeApis } from "../mongo/entities/MongoBackofficeApis";
import { MongoService } from "../mongo/mongo.service";

@Injectable()
export class BackOfficeMasterService {
	constructor(
		private configurationService: ConfigurationService,
		private externalApiCallService: ExternalApiCallService,
		private mongoService: MongoService
	) {}
	async getLoginData(request) {
		return await this.getResponseData(request, "getLoginData", null);
	}

	async getLoginDataBO(request) {
		const response = await this.getResponseData(request, "getLoginData", null);
		return response.data;
	}

	async getResponseData(request, url, queryParam) {
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
		const isTokenFromBackOffice = request.headers["backofficetoken"];
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

	async validateUser(userId: number, request) {
		const queryParam = { userId };
		const response = await this.getResponseData(request, "validateUser", queryParam);
		return response.data;
	}

	async getUserMenu(userId, appType, engineCode, languageCode, userRequired: string, request) {
		const queryParam = new Map();
		queryParam.set(VariablesConstant.USER_ID, userId);
		queryParam.set("appType", appType);
		queryParam.set("engineCode", engineCode);
		queryParam.set("languageCode", languageCode);
		queryParam.set("userRequired", userRequired);
		const response = await this.getResponseData(request, "getUserMenus", Object.fromEntries(queryParam));
		return response.data;
	}
}
