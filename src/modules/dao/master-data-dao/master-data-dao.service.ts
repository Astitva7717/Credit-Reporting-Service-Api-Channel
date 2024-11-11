import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CityMasterEntity } from "src/modules/master-data/entities/city-master-entity";
import { ClientTokensEntity } from "src/modules/master-data/entities/client-token.entity";
import { CountryMasterEntity } from "src/modules/master-data/entities/country-master-entity";
import { StateMasterEntity } from "src/modules/master-data/entities/state-master-entity";
import { Status } from "src/utils/enums/Status";
import { ResponseData } from "src/utils/enums/response";
import VariablesConstant from "src/utils/variables-constant";
import { Repository } from "typeorm";

@Injectable()
export class MasterDataDaoService {
	constructor(
		@InjectRepository(CountryMasterEntity)
		private countryMasterRepo: Repository<CountryMasterEntity>,
		@InjectRepository(StateMasterEntity)
		private stateMasterRepo: Repository<StateMasterEntity>,
		@InjectRepository(CityMasterEntity)
		private cityMasterRepo: Repository<CityMasterEntity>,
		@InjectRepository(ClientTokensEntity)
		private clientTokenRepo: Repository<ClientTokensEntity>
	) {}

	async findByCountryCode(countryCode) {
		const countryMaster = await this.countryMasterRepo.findOneBy({
			countryCode: countryCode,
			status: VariablesConstant["ACTIVE"]
		});
		if (!countryMaster) {
			throw new HttpException({ status: ResponseData["INVALID_COUNTRY_FOUND"] }, HttpStatus.OK);
		}
		return countryMaster;
	}

	async findByCountryCodeAndStateCodeAndStatus(countryCode, stateCode) {
		const stateMaster = await this.stateMasterRepo.findOneBy({
			countryCode,
			stateCode,
			status: VariablesConstant.ACTIVE
		});
		if (!stateMaster) {
			throw new HttpException({ status: ResponseData["INVALID_STATE_FOUND"] }, HttpStatus.OK);
		}
		return stateMaster;
	}

	async findActiveCountriesData() {
		const result = await this.countryMasterRepo.findBy({
			status: VariablesConstant.ACTIVE
		});
		if (!result) {
			throw new HttpException({ status: ResponseData["DATA_NOT_FOUND"] }, HttpStatus.OK);
		}

		return result;
	}

	async findByStateCodeAndStatus(stateCode) {
		const cityData = await this.cityMasterRepo.findBy({
			stateCode,
			status: Status.ACTIVE
		});
		if (!cityData) {
			throw new HttpException({ status: ResponseData["DATA_NOT_FOUND"] }, HttpStatus.OK);
		}
		return cityData;
	}

	async findByCountryCodeAndStateCodeAndCityCodeAndStatus(countryCode, stateCode, cityCode, status) {
		const cityMaster = await this.cityMasterRepo.findOneBy({
			countryCode,
			stateCode,
			cityCode,
			status
		});
		if (!cityMaster) {
			throw new HttpException({ status: ResponseData["INVALID_CITY_FOUND"] }, HttpStatus.OK);
		}
		return cityMaster;
	}

	async findByClientCodeAndTokenAndStatus(clientCode, token, status) {
		const clientTokens = await this.clientTokenRepo.findOneBy({
			clientCode,
			token,
			status
		});
		if (!clientTokens) {
			throw new HttpException({ status: ResponseData["INVALID_CLIENT"] }, HttpStatus.OK);
		}
		return clientTokens;
	}

	async findByClientCodeAndStatus(clientCode, status) {
		const clientTokens = await this.clientTokenRepo.findOneBy({
			clientCode,
			status
		});
		if (!clientTokens) {
			throw new HttpException({ status: ResponseData["INVALID_CLIENT"] }, HttpStatus.OK);
		}
		return clientTokens;
	}

	async findByCountryCodeAndStatus(countryCode) {
		const countryList = await this.stateMasterRepo.findBy({
			countryCode,
			status: Status.ACTIVE
		});
		if (!countryList.length) {
			throw new HttpException({ status: ResponseData["DATA_NOT_FOUND"] }, HttpStatus.OK);
		}
		return countryList;
	}
}
