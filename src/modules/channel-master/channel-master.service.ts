import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigurationService } from "src/utils/configuration/configuration.service";
import { ConfigTypes } from "src/utils/enums/config-type";
import { ResponseData } from "src/utils/enums/response";
import { UserType } from "src/utils/enums/user-types";
import VariablesConstant from "src/utils/variables-constant";
import { Status } from "../business-master/entities/business-configuration-master-entity";
import { BusinessDaoService } from "../dao/business-dao/business-dao.service";
import { ChannelDaoService } from "../dao/channel-dao/channel-dao.service";
import { CommonDaoService } from "../dao/common-dao/common-dao.service";
import { ChannelRegistrationRequest } from "./dto/channel-registration-request";
import { UpdateChannelRequest } from "./dto/update-channel-request";
import { UpdateConfigurationsRequest } from "./dto/update-configurations-request";
import { ChannelConfigurationMaster } from "./entities/channel-configuration-master-entity";
import { ChannelMaster } from "./entities/channel-master.entity";
import { ConfigurationMaster } from "./entities/configuration-master-entity";
import { AppLoggerService } from "src/app-logger/app-logger.service";
import { AppLoggerDto } from "@app-logger/app-logger.dto";

@Injectable()
export class ChannelMasterService {
	constructor(
		private configurationService: ConfigurationService,
		private channelDao: ChannelDaoService,
		private businessMasterDao: BusinessDaoService,
		private commonDao: CommonDaoService,
		private appLoggerService: AppLoggerService
	) {}

	async getChannelList(requestedBusinessId: number, request) {
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		await this.configurationService.validateBusinessChannelCheck(userDetailModel, requestedBusinessId, null);
		let responseObject;
		if (userDetailModel?.userTypeCode === UserType.SUPER_BO) {
			responseObject = await this.channelDao.findByBusinessIdAndStatus(requestedBusinessId, Status.ACTIVE);
		} else {
			const activeUserMappedChannels = await this.channelDao.findUserChannelsByUserIdAndStatus(
				userDetailModel.userId,
				1
			);
			if (!activeUserMappedChannels?.length) {
				throw new HttpException({ status: ResponseData["DATA_NOT_FOUND"] }, HttpStatus.OK);
			}
			const activeUserMappedChannelsIds = activeUserMappedChannels.map(
				(activeUserMappedChannel) => activeUserMappedChannel.channelId
			);
			responseObject = await this.channelDao.findByBusinessIdAndStatusAndChannelIdIn(
				requestedBusinessId,
				Status.ACTIVE,
				activeUserMappedChannelsIds
			);
		}
		return responseObject;
	}

	// @Transactional(rollbackFor = Exception.class)
	async channelRegistration(reqBean: ChannelRegistrationRequest) {
		const requestedConfigCodeList = reqBean.configs.map((config) => config.configCode); // NOSONAR
		const duplicateConfig: Set<string> = new Set(requestedConfigCodeList);
		if (duplicateConfig.size < requestedConfigCodeList.length) {
			throw new HttpException({ status: ResponseData["INVALID_CONFIGURATION"] }, HttpStatus.OK);
		}

		await this.businessMasterDao.findByBusinessIdAndStatus(reqBean.ucmBusinessId, Status.ACTIVE);
		await this.channelDao.existsByChannelDetails(reqBean.ucmBusinessId, reqBean.ucmChannelId, reqBean.ucmChannelName);
		await this.commonDao.findByCurrencyCode(reqBean.currencyCode);
		let channelMaster = new ChannelMaster(reqBean);
		channelMaster = await this.channelDao.save(channelMaster);
		await this.channelConfigSync(channelMaster.channelId, reqBean.configs, reqBean.channelType);
		return channelMaster;
	}

	// @Transactional(rollbackFor = Exception.class)
	async updateChannel(reqBean: UpdateChannelRequest) {
		await this.businessMasterDao.findByBusinessIdAndStatus(reqBean.ucmBusinessId, Status.ACTIVE);
		const channelMaster = await this.channelDao.findByBusinessIdAndChannelId(
			reqBean.ucmBusinessId,
			reqBean.ucmChannelId
		);
		let isUpdate = false;
		if (reqBean?.status && channelMaster.status !== Status[reqBean.status]) {
			channelMaster.status = Status[reqBean.status];
			isUpdate = true;
		}

		if (
			reqBean?.ucmChannelName &&
			channelMaster.name.toLocaleLowerCase() !== reqBean.ucmChannelName?.toLocaleLowerCase()
		) {
			channelMaster.name = reqBean.ucmChannelName;
			isUpdate = true;
		}
		if (isUpdate) {
			await this.channelDao.update(channelMaster);
		}

		if (reqBean?.configs?.length) {
			await this.channelConfigSync(channelMaster?.channelId, reqBean?.configs, channelMaster?.channelType);
		}
		return channelMaster;
	}

	async updateConfigurations(reqBean: UpdateConfigurationsRequest) {
		if (reqBean?.configs?.length) {
			const requestedConfigCodeList = reqBean.configs.map((config) => config.configCode + "_" + config.configType);

			const duplicateConfig: Set<string> = new Set(requestedConfigCodeList);
			if (duplicateConfig.size < requestedConfigCodeList.length) {
				throw new HttpException({ status: ResponseData["INVALID_CONFIGURATION"] }, HttpStatus.OK);
			}
			const existingMap: Map<string, ConfigurationMaster> = new Map();
			(await this.channelDao.findAllConfigs()).forEach((config) =>
				existingMap.set(config.configType + "_" + config.configCode, config)
			);

			const updatedConfigList: Array<ConfigurationMaster> = [];
			for (const codes of reqBean.configs) {
				if (!existingMap.get(codes.configType + "_" + codes.configCode)) {
					updatedConfigList.push(new ConfigurationMaster(codes));
				} else {
					const configToBeUpdated: ConfigurationMaster = existingMap.get(
						codes.configType + "_" + codes.configCode
					);
					configToBeUpdated.configValue = codes.configValue;
					configToBeUpdated.updatedAt = new Date();
					updatedConfigList.push(configToBeUpdated);
				}
			}
			await this.channelDao.saveAllConfigs(updatedConfigList);
		} else {
			throw new HttpException({ status: ResponseData["INVALID_CONFIGURATION"] }, HttpStatus.OK);
		}
		return {};
	}

	private async channelConfigSync(channelId, configCodesList, configType) {
		const configMap: Map<string, ConfigurationMaster> = new Map();
		(await this.channelDao.findByConfigType(ConfigTypes[configType])).forEach((k) => configMap.set(k.configCode, k));
		const channelConfigMap: Map<string, ChannelConfigurationMaster> = new Map();
		(await this.channelDao.findByChannelId(channelId)).forEach((k) => channelConfigMap.set(k.configCode, k));
		const channelConfigList: Array<ChannelConfigurationMaster> = [];
		const configList: Array<ConfigurationMaster> = [];
		try {
			configCodesList.forEach((config) => {
				const channelConfig = channelConfigMap.get(config.configCode);
				const defaultConfig = configMap.get(config.configCode);
				if (channelConfig)
					channelConfigList.push(channelConfig.update(config.configValue, Status[config.configStatus]));
				else
					channelConfigList.push(
						new ChannelConfigurationMaster(
							channelId,
							config.configCode,
							config.configValue,
							Status[config.configStatus]
						)
					);

				if (!defaultConfig) configList.push(new ConfigurationMaster(config));
			});
		} catch (e) {
			throw new HttpException({ status: ResponseData["INVALID_CONFIGURATION"] }, HttpStatus.OK);
		}
		await this.channelDao.saveAllConfigs(configList);
		await this.channelDao.saveAllChannelConfigs(channelConfigList);
		try {
			await this.configurationService.resetChannelConfigurations(channelId);
		} catch (e) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"error_in_reseting_cache",
				"channel_config_sync",
				"ChannelMasterService",
				"channelConfigSync",
				e
			);
			this.appLoggerService.writeLog(appLoggerDto);
		}
	}
}
