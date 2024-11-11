import { UserMasterEntity } from "@modules/user-master/entities/user-master.entity";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AliasMaster } from "src/modules/alias-master/entities/alias-master.entity";
import { Status } from "src/modules/business-master/entities/business-configuration-master-entity";
import { ChannelMaster } from "src/modules/channel-master/entities/channel-master.entity";
import { ResponseData } from "src/utils/enums/response";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class AliasDaoService {
	constructor(
		@InjectRepository(AliasMaster)
		private aliasMasterRepo: Repository<AliasMaster>,

		private dataSource: DataSource
	) {}

	async save(aliasMaster: AliasMaster) {
		return await this.aliasMasterRepo.save(aliasMaster);
	}

	async findByChannelIdAndStatus(channelId: number, status: Status) {
		const aliasList = await this.aliasMasterRepo.findBy({ channelId, status });
		if (!aliasList.length) {
			throw new HttpException({ status: ResponseData["INVALID_COUNTRY_FOUND"] }, HttpStatus.OK);
		}
		return aliasList;
	}

	async fetchActiveAlias() {
		const aliasList = await this.aliasMasterRepo.findBy({
			status: Status.ACTIVE
		});
		if (!aliasList.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return aliasList;
	}

	async findAll() {
		return await this.aliasMasterRepo.find();
	}

	async existsByAliasIdAndStatus(aliasId, status) {
		return (await this.aliasMasterRepo.findBy({ aliasId, status })).length;
	}

	async existsByChannelIdAndAliasId(channelId, aliasId) {
		return (
			await this.aliasMasterRepo.findBy({
				channelId,
				aliasId,
				status: Status.ACTIVE
			})
		).length;
	}

	async existsByChannelIdAndNameAndStatus(channelId, aliasName, status) {
		return (await this.aliasMasterRepo.findBy({ channelId, name: aliasName, status })).length;
	}

	async findByChannelIdAndAliasIdAndStatus(channelId, aliasId, status) {
		const aliasMaster = await this.aliasMasterRepo.findOneBy({
			channelId,
			aliasId,
			status
		});
		if (!aliasMaster) {
			throw new HttpException({ status: ResponseData.INVALID_ALIAS }, HttpStatus.OK);
		}
		return aliasMaster;
	}

	async findByNameAndStatus(name, status) {
		const aliasMaster = await this.aliasMasterRepo.findOneBy({ name, status });
		if (!aliasMaster) {
			throw new HttpException({ status: ResponseData.INVALID_ALIAS }, HttpStatus.OK);
		}
		return aliasMaster;
	}

	async getBusinessAndChannelByAlias(aliasName: string) {
		let aliasData = await this.getAliasData(aliasName);
		let channelData = await this.getChannelData(aliasData.channelId);
		return {
			channelId: channelData?.channelId,
			businessId: channelData?.businessId,
			aliasId: aliasData?.aliasId
		};
	}

	async getAliasData(aliasName: string) {
		if (aliasName) {
			let aliasData = await this.dataSource.getRepository(AliasMaster).findOne({
				where: {
					name: aliasName,
					status: Status.ACTIVE
				}
			});
			if (aliasData) {
				return aliasData;
			}
		}
		throw new HttpException({ data: {}, status: ResponseData.INVALID_ALIAS }, HttpStatus.OK);
	}

	async getChannelData(channelId: number) {
		let channelData = await this.dataSource.getRepository(ChannelMaster).findOne({
			where: {
				channelId: channelId,
				status: Status.ACTIVE
			}
		});

		if (channelData) {
			return channelData;
		}
		throw new HttpException({ data: {}, status: ResponseData.INVALID_CHANNEL_FOUND }, HttpStatus.OK);
	}

	async getAliasDataByUserId(userId: number) {
		const aliasData = await this.dataSource
			.getRepository(AliasMaster)
			.createQueryBuilder("aliasMaster")
			.innerJoin(UserMasterEntity, "masterUser", "masterUser.aliasId = aliasMaster.aliasId")
			.select("aliasMaster.name as aliasName")
			.where(`masterUser.userId = :userId`, { userId })
			.getRawOne();
		if (aliasData) {
			return aliasData;
		}
		throw new HttpException({ data: {}, status: ResponseData.INVALID_ALIAS_ID }, HttpStatus.OK);
	}

	async getAliasDataByAliasId(aliasId: number) {
		let aliasData = await this.dataSource.getRepository(AliasMaster).findOne({
			where: {
				aliasId,
				status: Status.ACTIVE
			}
		});
		if (aliasData) {
			return aliasData;
		}

		throw new HttpException({ data: {}, status: ResponseData.INVALID_ALIAS }, HttpStatus.OK);
	}
}
