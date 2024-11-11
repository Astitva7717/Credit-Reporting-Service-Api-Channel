import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ChannelConfigurationMaster } from "src/modules/channel-master/entities/channel-configuration-master-entity";
import { ChannelMaster } from "src/modules/channel-master/entities/channel-master.entity";
import { ConfigurationMaster } from "src/modules/channel-master/entities/configuration-master-entity";
import { UserChannelMapping } from "src/modules/user-master/entities/user-channel-mapping.entity";
import { ResponseData } from "src/utils/enums/response";
import { In, Repository } from "typeorm";
import { Status } from "src/modules/business-master/entities/business-master.entity";
@Injectable()
export class ChannelDaoService {
	constructor(
		@InjectRepository(ChannelMaster)
		private channelMasterRepo: Repository<ChannelMaster>,
		@InjectRepository(UserChannelMapping)
		private userChannelMappingRepo: Repository<UserChannelMapping>,
		@InjectRepository(ConfigurationMaster)
		private configurationMasterRepo: Repository<ConfigurationMaster>,
		@InjectRepository(ChannelConfigurationMaster)
		private channelConfigurationMasterRepo: Repository<ChannelConfigurationMaster>
	) {}

	async findChannelMasterByChannelId(channelId) {
		const channelMaster = await this.channelMasterRepo.findOneBy({ channelId });
		if (!channelMaster) {
			throw new HttpException({ status: ResponseData["INVALID_CHANNEL_FOUND"] }, HttpStatus.OK);
		}
		return channelMaster;
	}

	async fetchAll() {
		const result = await this.channelMasterRepo.find();
		if (!result.length) {
			throw new HttpException({ status: ResponseData["DATA_NOT_FOUND"] }, HttpStatus.OK);
		}
		return result;
	}

	async findByBusinessIdAndStatus(businessId, status) {
		const result = await this.channelMasterRepo.findOneBy({
			businessId,
			status
		});
		if (!result) {
			throw new HttpException({ status: ResponseData["DATA_NOT_FOUND"] }, HttpStatus.OK);
		}
		return [result];
	}

	async existsByChannelDetails(businessId, channelId, name) {
		if (await this.channelMasterRepo.findOneBy({ channelId, businessId })) {
			throw new HttpException({ status: ResponseData["EXISTS_CHANNEL_ID"] }, HttpStatus.OK);
		}
		if (await this.channelMasterRepo.findOneBy({ name, businessId })) {
			throw new HttpException({ status: ResponseData["EXISTS_CHANNEL_NAME"] }, HttpStatus.OK);
		}
		return true;
	}

	async save(channelMaster) {
		return await this.channelMasterRepo.save(channelMaster);
	}

	async update(channelMaster) {
		return await this.channelMasterRepo.save(channelMaster);
	}

	async saveAll(userChannelMappingList) {
		return await this.userChannelMappingRepo.save(userChannelMappingList);
	}

	async findUserChannelsByUserIdAndStatus(userId, status) {
		return await this.userChannelMappingRepo.find({
			select: { channelId: true },
			where: { userId, status }
		});
	}

	async findByBusinessIdAndStatusAndChannelIdIn(businessId, status, channelIds) {
		const listOfChannels = await this.channelMasterRepo.findBy({
			businessId,
			status,
			channelId: In(channelIds)
		});
		if (!listOfChannels.length) {
			throw new HttpException({ status: ResponseData["DATA_NOT_FOUND"] }, HttpStatus.OK);
		}
		return listOfChannels;
	}

	async findUserChannelsByUserId(userId) {
		return await this.userChannelMappingRepo.findBy({ userId });
	}

	async findByBusinessIdAndChannelId(businessId, channelId) {
		const channelMaster = await this.channelMasterRepo.findOneBy({
			businessId,
			channelId
		});
		if (!channelMaster) {
			throw new HttpException({ status: ResponseData["INVALID_CHANNEL_FOUND"] }, HttpStatus.OK);
		}
		return channelMaster;
	}

	async findByBusinessIdAndChannelIdAndStatus(businessId, channelId, status) {
		const channelMaster = await this.channelMasterRepo.findOneBy({
			businessId,
			channelId,
			status
		});
		if (!channelMaster) {
			throw new HttpException({ status: ResponseData["INVALID_CHANNEL_FOUND"] }, HttpStatus.OK);
		}
		return channelMaster;
	}

	async findByConfigType(configType) {
		const configList = await this.configurationMasterRepo.findBy({
			configType
		});
		if (!configList.length) {
			throw new HttpException({ status: ResponseData["DATA_NOT_FOUND"] }, HttpStatus.OK);
		}
		return configList;
	}

	async findByConfigTypeAndConfigCodeIn(configType, configCodes) {
		const configList = await this.configurationMasterRepo.findBy({
			configType,
			configCode: configCodes
		});
		if (!configList.length) {
			throw new HttpException({ status: ResponseData["DATA_NOT_FOUND"] }, HttpStatus.OK);
		}
		return configList;
	}

	async fetchByChannelId(channelId) {
		return await this.channelConfigurationMasterRepo.findBy({ channelId });
	}

	async findByChannelId(channelId) {
		return await this.channelConfigurationMasterRepo.findBy({ channelId });
	}

	async getAllChannelConfigurations() {
		return await this.channelConfigurationMasterRepo.findBy({ status: Status.ACTIVE });
	}

	async updateConfigValue(configValue, configCode, channelId, updatedAt) {
		return await this.channelConfigurationMasterRepo.update({ configValue, configCode }, { channelId, updatedAt });
	}

	async findAllConfigs() {
		return await this.configurationMasterRepo.find();
	}

	async saveAllConfigs(updatedConfigList) {
		return await this.configurationMasterRepo.save(updatedConfigList);
	}

	async saveAllChannelConfigs(updatedChannelConfigList) {
		return await this.channelConfigurationMasterRepo.save(updatedChannelConfigList);
	}

	async findByChannelIdIn(channelIds) {
		const listOfDomains = await this.channelMasterRepo.findBy({
			channelId: channelIds
		});
		if (!listOfDomains.length) {
			throw new HttpException({ status: ResponseData["DATA_NOT_FOUND"] }, HttpStatus.OK);
		}
		return listOfDomains;
	}

	async findMapByChannelIdIn(channelIds) {
		const domainList = new Array(channelIds);
		const domainMasterMap = new Map();
		(await this.findByChannelIdIn(domainList)).forEach((k) => domainMasterMap.set(k.channelId, k));
		return domainMasterMap;
	}

	async findByConfigCodeAndConfigType(configCode, configType) {
		return await this.configurationMasterRepo.findOneBy({
			configCode,
			configType
		});
	}

	async findAllChannelMaster() {
		return await this.channelMasterRepo.find();
	}
}
