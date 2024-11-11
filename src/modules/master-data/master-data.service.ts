import { Injectable } from "@nestjs/common";
import VariablesConstant from "src/utils/variables-constant";
import { MasterDataDaoService } from "../dao/master-data-dao/master-data-dao.service";

@Injectable()
export class MasterDataService {
	constructor(private masterDataDao: MasterDataDaoService) {}
	async getAllCountries() {
		const result = (await this.masterDataDao.findActiveCountriesData()) || [];
		const countryList = [];
		result.forEach((obj) => {
			const singleCountry = {};
			singleCountry[VariablesConstant.COUNTRY_CODE] =  obj.countryCode;
			singleCountry["countryName"] =  obj.name;
			singleCountry["isdCode"] =  obj.isdCodes;
			countryList.push(singleCountry);
		});

		return countryList;
	}

	async getStateByCountryCode(countryCode: string) {
		const result = await this.masterDataDao.findByCountryCodeAndStatus(countryCode);
		const stateList = [];
		result.forEach((obj) => {
			const singleState = {};
			singleState[VariablesConstant.COUNTRY_CODE] =  obj.countryCode;
			singleState[VariablesConstant.STATE_CODE] =  obj.stateCode;
			singleState["stateName"] =  obj.name;
			stateList.push(singleState);
		});
		return stateList;
	}

	async getCityByStateCode(stateCode: string) {
		const result = await this.masterDataDao.findByStateCodeAndStatus(stateCode);
		const cityList = [];
		result.forEach((obj) => {
			const singleCity = {};
			singleCity[VariablesConstant.COUNTRY_CODE] =  obj.countryCode;
			singleCity[VariablesConstant.STATE_CODE] =  obj.stateCode;
			singleCity[VariablesConstant.CITY_CODE] =  obj.cityCode;
			singleCity[VariablesConstant.CITY_NAME] =  obj.cityName;
			cityList.push(singleCity);
		});
		return cityList;
	}
}
