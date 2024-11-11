import {
	// CACHE_MANAGER,
	HttpException,
	HttpStatus,
	Injectable
} from "@nestjs/common";
import { CommonUtilityService } from "src/utils/common/common-utility/common-utility.service";
import { ConfigTypes } from "src/utils/enums/config-type";
import { ResponseData } from "src/utils/enums/response";
import VariablesConstant from "src/utils/variables-constant";
import { ConfigurationService } from "../../utils/configuration/configuration.service";
import { BusinessDaoService } from "../dao/business-dao/business-dao.service";
import { ChannelDaoService } from "../dao/channel-dao/channel-dao.service";
import { UserHelperService } from "../user-master/user-helper/user-helper.service";
import { BusinessRegistrationRequest } from "./dto/create-business-master.dto";
import { BusinessConfigurationMaster, Status } from "./entities/business-configuration-master-entity";
import { BusinessMaster } from "./entities/business-master.entity";
import { ConfigurationMaster } from "../channel-master/entities/configuration-master-entity";
import { AppLoggerService } from "src/app-logger/app-logger.service";
import { AppLoggerDto } from "@app-logger/app-logger.dto";

@Injectable()
export class BusinessMasterService {
	constructor(
		private businessMasterDao: BusinessDaoService,
		private configurationService: ConfigurationService,
		private channelDaoService: ChannelDaoService,
		private userHelper: UserHelperService,
		private appLoggerService: AppLoggerService // @Inject(CACHE_MANAGER) private cacheService: Cache,
	) {}

	async businessRegistration(businessRegistrationRequest: BusinessRegistrationRequest) {
		const requestedConfigCodeList = businessRegistrationRequest.configs;
		const duplicateConfig = new Set(requestedConfigCodeList);

		if (duplicateConfig?.size < requestedConfigCodeList.length) {
			throw new HttpException({ status: ResponseData["INVALID_CONFIGURATION"] }, HttpStatus.OK);
		}

		await this.businessMasterDao.existsByBusinessId(businessRegistrationRequest.ucmBusinessId);

		await this.businessMasterDao.existsByBusinessCode(businessRegistrationRequest.businessCode);

		const configMap = await this.configurationService.getBusinessConfigurations(0);
		CommonUtilityService.isEmailValid(configMap.get("EMAIL_REGEX"), businessRegistrationRequest.emailId);

		CommonUtilityService.isMobileValid(
			configMap.get("MOBILE_REGEX"),
			`${businessRegistrationRequest.mobileCode}${businessRegistrationRequest.mobileNumber}`
		);

		CommonUtilityService.isZipcodeValid(configMap.get("ZIPCODE_REGEX"), businessRegistrationRequest.zipCode);

		await this.businessMasterDao.existsByEmailId(businessRegistrationRequest.emailId);

		await this.businessMasterDao.existsByMobileCodeAndMobileNumber(
			businessRegistrationRequest.mobileCode,
			businessRegistrationRequest.mobileNumber
		);

		if (businessRegistrationRequest.phoneCode || businessRegistrationRequest.phoneNumber) {
			CommonUtilityService.isMobileValid(
				configMap.get("MOBILE_REGEX"),
				businessRegistrationRequest.phoneCode + businessRegistrationRequest.phoneNumber
			);
		}
		const countryStateCityNameMap = await this.userHelper.validateCityStateAndCountry(
			businessRegistrationRequest.stateCode,
			businessRegistrationRequest.countryCode
		);
		businessRegistrationRequest.state = countryStateCityNameMap.get("state");
		businessRegistrationRequest.country = countryStateCityNameMap.get("country");

		let businessMaster: BusinessMaster = new BusinessMaster(businessRegistrationRequest);
		businessMaster.city = businessRegistrationRequest.cityName;
		businessMaster = await this.businessMasterDao.save(businessMaster);
		await this.businessConfigSync(businessMaster.businessId, businessRegistrationRequest.configs, "BACKOFFICE");

		return businessMaster;
	}

	async getBusinessList(request) {
		const userDetailModel = request[VariablesConstant?.USER_DETAIL_MODEL];
		let responseBusinessList = [];
		if (userDetailModel?.accessSelfBusinessOnly === "YES") {
			responseBusinessList.push(
				await this.businessMasterDao.findByBusinessIdAndStatus(userDetailModel.businessId, Status.ACTIVE)
			);
		} else {
			responseBusinessList = await this.businessMasterDao.findByBusinessIdNot(0);
		}

		return responseBusinessList;
	}

	async businessConfigSync(businessId, configCodesList, configType) {
		const configMap = new Map();
		(await this.channelDaoService.findByConfigType(ConfigTypes[configType])).forEach((k) =>
			configMap.set(k.configCode, k)
		);
		const businessConfigMap = new Map();
		(await this.businessMasterDao.findByBusinessId(businessId)).forEach((k) => businessConfigMap.set(k.configCode, k));
		const businessConfigList = new Array();
		const configList = new Array();
		try {
			configCodesList.forEach((config) => {
				const businessConfig: BusinessConfigurationMaster = businessConfigMap.get(config.configCode);
				const defaultConfig = configMap.get(config.configCode);
				if (businessConfig) {
					businessConfigList.push({
						...businessConfig,
						configValue: config.configValue,
						status: Status[config.configStatus] ?? Status.ACTIVE,
						updatedAt: new Date()
					});
				} else {
					businessConfigList.push({
						businessId,
						configCode: config.configCode,
						configValue: config.configValue,
						status: Status[config.configStatus] ?? Status.ACTIVE,
						createdAt: new Date(),
						updatedAt: new Date()
					});
				}
				if (!defaultConfig) {
					configList.push(new ConfigurationMaster(config));
				}
			});
		} catch (e) {
			throw new HttpException({ status: ResponseData["INVALID_CONFIGURATION"] }, HttpStatus.OK);
		}
		await this.channelDaoService.saveAllConfigs(configList);
		await this.businessMasterDao.saveAllBusinessConfigs(businessConfigList);
		try {
			await this.configurationService.resetBusinessConfigurations(businessId);
		} catch (e) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"error_in_reseting_cache",
				"business_config_sync",
				"businessMasterService",
				"businessConfigSync",
				e
			);
			this.appLoggerService.writeLog(appLoggerDto);
		}
	}

	async updateBusinessDetails(updateBusinessRequest: BusinessRegistrationRequest) {
		const businessMaster: BusinessMaster = await this.businessMasterDao.findBusinessMasterByBusinessId(
			updateBusinessRequest.ucmBusinessId
		);
		const configMap = await this.configurationService.getBusinessConfigurations(updateBusinessRequest.ucmBusinessId);
		if (updateBusinessRequest.emailId && updateBusinessRequest.emailId !== businessMaster.emailId) {
			CommonUtilityService.isEmailValid(configMap.get("EMAIL_REGEX"), updateBusinessRequest.emailId);
		}
		if (updateBusinessRequest.mobileNumber && updateBusinessRequest.mobileNumber !== businessMaster.mobileNumber) {
			if (!updateBusinessRequest.mobileCode) {
				throw new HttpException({ status: ResponseData["INVALID_MOBILE_CODE"] }, HttpStatus.OK);
			}
			CommonUtilityService.isMobileValid(
				configMap.get(VariablesConstant.MOBILE_REGEX),
				updateBusinessRequest.mobileCode + updateBusinessRequest.mobileNumber
			);
		}
		if (updateBusinessRequest.phoneNumber && updateBusinessRequest.phoneNumber !== businessMaster.phoneNumber) {
			if (!updateBusinessRequest.phoneCode) {
				throw new HttpException({ status: ResponseData["INVALID_MOBILE_CODE"] }, HttpStatus.OK);
			}
			CommonUtilityService.isMobileValid(
				configMap.get(VariablesConstant.MOBILE_REGEX),
				updateBusinessRequest.phoneCode + updateBusinessRequest.phoneNumber
			);
		}
		if (updateBusinessRequest.zipCode && updateBusinessRequest.zipCode !== businessMaster.zipCode) {
			CommonUtilityService.isZipcodeValid(configMap.get("ZIPCODE_REGEX"), updateBusinessRequest.zipCode);
		}
		const cityStateCountryValidationMap = await this.userHelper.validateCityStateAndCountry(
			updateBusinessRequest.stateCode,
			updateBusinessRequest.countryCode
		);
		updateBusinessRequest.country = cityStateCountryValidationMap.get("country");
		updateBusinessRequest.state = cityStateCountryValidationMap.get("state");
		const obj: BusinessMaster = new BusinessMaster(updateBusinessRequest);
		obj.city = updateBusinessRequest.cityName;
		obj.updatedAt = new Date();

		if (updateBusinessRequest?.status) {
			obj.status = Status[updateBusinessRequest.status];
		}
		await this.businessMasterDao.save(obj);
		if (updateBusinessRequest.configs?.length) {
			await this.businessConfigSync(businessMaster.businessId, updateBusinessRequest.configs, "BACKOFFICE");
		}
		return {};
	}
}
