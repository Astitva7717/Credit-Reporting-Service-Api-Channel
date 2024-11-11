import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import VariablesConstant from "src/utils/variables-constant";
import { createDecipher } from "crypto";
import { ResponseData } from "../enums/response";
import { BusinessDaoService } from "src/modules/dao/business-dao/business-dao.service";
import { ChannelDaoService } from "src/modules/dao/channel-dao/channel-dao.service";
import { Status } from "../enums/Status";
import { ConfigTypes } from "../enums/config-type";
import { Redis } from "ioredis";
import { RedisService } from "@liaoliaots/nestjs-redis";

@Injectable()
export class ConfigurationService {
	private readonly redis: Redis;
	constructor(
		private businessMasterDao: BusinessDaoService,
		private channelDao: ChannelDaoService,
		private readonly redisService: RedisService
	) {
		this.redis = this.redisService.getClient();
	}

	// @Cacheable(cacheNames = "NFT_businessConfig", key = "(#businessId)")
	async getConfigurations(configType: string, channelId: number, businessId: number, request) {
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		await this.validateBusinessChannelCheck(userDetailModel, businessId, channelId);
		let config;
		if (configType === ConfigTypes.BACKOFFICE) {
			config = await this.getBusinessConfigurations(businessId);
		} else {
			config = await this.getChannelConfigurations(channelId, configType);
		}
		return Object.fromEntries(config);
	}

	decryptBearerToken(token) {
		try {
			token = token.split(" ")[1];
			const decipher = createDecipher("aes-256-cbc", process.env.ENCRYPT_DECRYPT_KEY);
			let decryptedPassword = decipher.update(token, "base64", "utf8");
			decryptedPassword += decipher.final("utf8");
			return "Bearer " + decryptedPassword;
		} catch (e) {
			throw new HttpException({ status: ResponseData.ERROR_IN_DECRYPTING_TOKEN }, HttpStatus.OK);
		}
	}

	async setConfigsInRedis(key: string, configValues: Map<string, string>) {
		const configs = Object.fromEntries(configValues);
		await this.redis.set(key, JSON.stringify(configs));
	}

	async getBusinessConfigurations(businessId: number): Promise<Map<string, string>> {
		const redisKey = `CRYR_BUSINESS_CONFIGS_${businessId}`;
		let businessConfigs = await this.redis.get(redisKey);
		if (businessConfigs) {
			const configs = JSON.parse(businessConfigs);
			if (Object.keys(configs).length) {
				return new Map(Object.entries(configs));
			}
		}

		const defaultConfigs = await this.channelDao.findByConfigType(ConfigTypes.BACKOFFICE);
		const mapOfBusinessConfigs: Map<string, string> = new Map();
		(await this.businessMasterDao.findByBusinessId(businessId)).forEach((businessConfig) => {
			mapOfBusinessConfigs.set(businessConfig.configCode, businessConfig.configValue);
		});

		const mapOfConfig: Map<string, string> = new Map();
		for (const configurationMaster of defaultConfigs) {
			const configValue: string = !mapOfBusinessConfigs.get(configurationMaster.configCode)
				? configurationMaster.configValue
				: mapOfBusinessConfigs.get(configurationMaster.configCode);
			mapOfConfig.set(configurationMaster.configCode, configValue);
		}
		await this.setConfigsInRedis(redisKey, mapOfConfig);
		return mapOfConfig;
	}

	async getAllB2BBusinessConfigurations(businessId: number): Promise<Map<string, string>> {
		const defaultConfigs = await this.channelDao.findByConfigType(ConfigTypes.B2B);
		const mapOfBusinessConfigs: Map<string, string> = new Map();
		(await this.businessMasterDao.findByBusinessId(businessId)).forEach((businessConfig) => {
			mapOfBusinessConfigs.set(businessConfig.configCode, businessConfig.configValue);
		});

		const mapOfConfig: Map<string, string> = new Map();
		for (const configurationMaster of defaultConfigs) {
			const configValue: string = !mapOfBusinessConfigs.get(configurationMaster.configCode)
				? configurationMaster.configValue
				: mapOfBusinessConfigs.get(configurationMaster.configCode);
			mapOfConfig.set(configurationMaster.configCode, configValue);
		}
		return mapOfConfig;
	}

	async getChannelConfigurations(channelId: number, configType: string = null): Promise<Map<string, string>> {
		if (channelId !== 0) {
			const channelMaster = await this.channelDao.findChannelMasterByChannelId(channelId);
			if (!channelMaster) {
				throw new HttpException({ status: ResponseData["INVALID_CHANNEL_FOUND"] }, HttpStatus.OK);
			}
			configType = channelMaster.channelType;
		}

		const redisKey = `CRYR_CHANNEL_CONFIGS_${channelId}`;
		let channelConfigs = await this.redis.get(redisKey);
		if (channelConfigs) {
			const configs = JSON.parse(channelConfigs);
			if (Object.keys(configs).length) {
				return new Map(Object.entries(configs));
			}
		}
		const defaultConfigs = await this.channelDao.findByConfigType(ConfigTypes[configType]);
		const mapOfChannelConfigs: Map<string, string> = new Map();
		(await this.channelDao.findByChannelId(channelId)).forEach((channelConfig) => {
			mapOfChannelConfigs.set(channelConfig.configCode, channelConfig.configValue);
		});

		const mapOfConfig: Map<string, string> = new Map();

		for (const configurationMaster of defaultConfigs) {
			const configValue = !mapOfChannelConfigs?.get(configurationMaster.configCode)
				? configurationMaster.configValue
				: mapOfChannelConfigs?.get(configurationMaster.configCode);
			mapOfConfig.set(configurationMaster.configCode, configValue);
		}
		await this.setConfigsInRedis(redisKey, mapOfConfig);
		return mapOfConfig;
	}

	async validateBusinessChannelCheck(userDetailModel, requestedBusinessId: number, requestedChannelId: number) {
		const responseMap = new Map();
		if (requestedBusinessId === 0 || !Number(requestedBusinessId)) {
			throw new HttpException({ status: ResponseData["INVALID_BUSINESS"] }, HttpStatus.OK);
		}
		if (requestedChannelId === 0 || (requestedChannelId && !Number(requestedChannelId))) {
			throw new HttpException({ status: ResponseData["INVALID_CHANNEL_FOUND"] }, HttpStatus.OK);
		}
		responseMap.set(
			"businessMaster",
			await this.businessMasterDao.findByBusinessIdAndStatus(requestedBusinessId, Status.ACTIVE)
		);
		if (
			userDetailModel?.accessSelfBusinessOnly === "YES" &&
			userDetailModel?.businessId?.toString() !== requestedBusinessId?.toString()
		) {
			throw new HttpException({ status: ResponseData["NOT_ALLOWED"] }, HttpStatus.OK);
		}

		if (requestedChannelId && requestedChannelId >= 0) {
			const channelMaster = await this.channelDao.findChannelMasterByChannelId(requestedChannelId);
			responseMap.set("channelMaster", channelMaster);
			if (channelMaster?.businessId?.toString() !== requestedBusinessId?.toString()) {
				throw new HttpException({ status: ResponseData["NOT_ALLOWED"] }, HttpStatus.OK);
			}
			const allowedChannelIds = await this.channelDao.findUserChannelsByUserIdAndStatus(userDetailModel?.userId, 1);
			const activeUserMappedChannelsIds = allowedChannelIds.map((activeUserMappedChannel) =>
				activeUserMappedChannel?.channelId?.toString()
			);
			if (
				userDetailModel?.accessSelfBusinessOnly === "YES" &&
				(!activeUserMappedChannelsIds.length ||
					!activeUserMappedChannelsIds.includes(requestedChannelId?.toString()))
			) {
				throw new HttpException({ status: ResponseData["NOT_ALLOWED"] }, HttpStatus.OK);
			}
		}
		return responseMap;
	}

	async resetBusinessConfigurations(businessId: number): Promise<Map<string, string>> {
		const redisKey = `CRYR_BUSINESS_CONFIGS_${businessId}`;
		const defaultConfigs = await this.channelDao.findByConfigType(ConfigTypes.BACKOFFICE);
		const mapOfBusinessConfigs: Map<string, string> = new Map();
		(await this.businessMasterDao.findByBusinessId(businessId)).forEach((businessConfig) => {
			mapOfBusinessConfigs.set(businessConfig.configCode, businessConfig.configValue);
		});
		const mapOfConfig: Map<string, string> = new Map();
		for (const configurationMaster of defaultConfigs) {
			const configValue: string = !mapOfBusinessConfigs.get(configurationMaster.configCode)
				? configurationMaster.configValue
				: mapOfBusinessConfigs.get(configurationMaster.configCode);
			mapOfConfig.set(configurationMaster.configCode, configValue);
		}
		await this.setConfigsInRedis(redisKey, mapOfConfig);
		return mapOfConfig;
	}

	async resetChannelConfigurations(channelId: number, configType: string = null): Promise<Map<string, string>> {
		if (channelId !== 0) {
			const channelMaster = await this.channelDao.findChannelMasterByChannelId(channelId);
			if (!channelMaster) {
				throw new HttpException({ status: ResponseData["INVALID_CHANNEL_FOUND"] }, HttpStatus.OK);
			}
			configType = channelMaster.channelType;
		}

		const redisKey = `CRYR_CHANNEL_CONFIGS_${channelId}`;
		const defaultConfigs = await this.channelDao.findByConfigType(ConfigTypes[configType]);
		const mapOfChannelConfigs: Map<string, string> = new Map();
		(await this.channelDao.findByChannelId(channelId)).forEach((channelConfig) => {
			mapOfChannelConfigs.set(channelConfig.configCode, channelConfig.configValue);
		});

		const mapOfConfig: Map<string, string> = new Map();

		for (const configurationMaster of defaultConfigs) {
			const configValue = !mapOfChannelConfigs?.get(configurationMaster.configCode)
				? configurationMaster.configValue
				: mapOfChannelConfigs?.get(configurationMaster.configCode);
			mapOfConfig.set(configurationMaster.configCode, configValue);
		}
		await this.setConfigsInRedis(redisKey, mapOfConfig);
		return mapOfConfig;
	}
}
