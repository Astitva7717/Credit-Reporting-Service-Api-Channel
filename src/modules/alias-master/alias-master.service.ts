import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigurationService } from "src/utils/configuration/configuration.service";
import { ResponseData } from "src/utils/enums/response";
import VariablesConstant from "src/utils/variables-constant";
import { Status } from "../business-master/entities/business-configuration-master-entity";
import { AliasDaoService } from "../dao/alias-dao/alias-dao.service";
import { BusinessDaoService } from "../dao/business-dao/business-dao.service";
import { ChannelDaoService } from "../dao/channel-dao/channel-dao.service";
import { AliasRequestBean } from "./dto/alias-request.dto";
import { AliasMaster } from "./entities/alias-master.entity";

@Injectable()
export class AliasMasterService {
	constructor(
		private businessMasterDao: BusinessDaoService,
		private channelDao: ChannelDaoService,
		private aliasDao: AliasDaoService,
		private configurationService: ConfigurationService
	) {}
	async createAlias(createAliasRequest: AliasRequestBean) {
		await this.businessMasterDao.findByBusinessIdAndStatus(createAliasRequest.ucmBusinessId, Status.ACTIVE);
		await this.channelDao.findByBusinessIdAndChannelIdAndStatus(
			createAliasRequest.ucmBusinessId,
			createAliasRequest.ucmChannelId,
			Status.ACTIVE
		);
		await this.checkAliasExistOrNot(
			createAliasRequest.ucmChannelId,
			createAliasRequest.ucmAliasId,
			createAliasRequest.ucmAliasName
		);
		let aliasMaster: AliasMaster = new AliasMaster(createAliasRequest);
		aliasMaster = await this.aliasDao.save(aliasMaster);

		return aliasMaster;
	}

	async updateAlias(updateAliasReq: AliasRequestBean) {
		await this.businessMasterDao.findByBusinessIdAndStatus(updateAliasReq.ucmBusinessId, Status.ACTIVE);
		await this.channelDao.findByBusinessIdAndChannelIdAndStatus(
			updateAliasReq.ucmBusinessId,
			updateAliasReq.ucmChannelId,
			Status.ACTIVE
		);
		const aliasMaster: AliasMaster = await this.aliasDao.findByChannelIdAndAliasIdAndStatus(
			updateAliasReq.ucmChannelId,
			updateAliasReq.ucmAliasId,
			Status.ACTIVE
		);
		if (
			aliasMaster?.name.toLocaleLowerCase() === updateAliasReq?.ucmAliasName?.toLocaleLowerCase() &&
			aliasMaster.status === updateAliasReq.status
		) {
			throw new HttpException({ status: ResponseData["INVALID_PARAMETER"] }, HttpStatus.OK);
		} else if (aliasMaster?.name === updateAliasReq?.ucmAliasName) {
			aliasMaster.status = updateAliasReq?.status?.toUpperCase() === "ACTIVE" ? Status.ACTIVE : Status.INACTIVE;
			aliasMaster.updatedAt = new Date();
		} else {
			aliasMaster.name = updateAliasReq.ucmAliasName;
			aliasMaster.status = updateAliasReq?.status?.toUpperCase() === "ACTIVE" ? Status.ACTIVE : Status.INACTIVE;
			aliasMaster.updatedAt = new Date();
		}
		await this.aliasDao.save(aliasMaster);
		return aliasMaster;
	}

	async getChannelAlias(requestedBusinessId: number, channelId: number, request) {
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		await this.configurationService.validateBusinessChannelCheck(userDetailModel, requestedBusinessId, channelId);
		const alias: Array<AliasMaster> = await this.aliasDao.findByChannelIdAndStatus(channelId, Status.ACTIVE);

		return alias;
	}

	private async checkAliasExistOrNot(channelId: number, aliasId: number, aliasName: string) {
		if (await this.aliasDao.existsByChannelIdAndAliasId(channelId, aliasId)) {
			throw new HttpException({ status: ResponseData["ALREADY_EXIST_ALIAS"] }, HttpStatus.OK);
		}
		if (await this.aliasDao.existsByChannelIdAndNameAndStatus(channelId, aliasName, Status.ACTIVE)) {
			throw new HttpException({ status: ResponseData["ALREADY_EXIST_ALIAS"] }, HttpStatus.OK);
		}
	}
}
