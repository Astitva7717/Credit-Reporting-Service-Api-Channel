import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CurrencyConvertorMaster } from "src/modules/currency-convertor/entities/currency-convertor-master.entity";
import { ResponseData } from "src/utils/enums/response";
import { Repository } from "typeorm";

@Injectable()
export class CommonDaoService {
	constructor(
		@InjectRepository(CurrencyConvertorMaster)
		private currencyMasterRepo: Repository<CurrencyConvertorMaster>
	) {}

	async findByCurrencyCode(currencyCode) {
		const currency = await this.currencyMasterRepo.findOneBy({ currencyCode });
		if (!currency) {
			throw new HttpException({ status: ResponseData["INVALID_CURRENCY"] }, HttpStatus.OK);
		}

		return currency;
	}

	async findByCountryCode(countryCode) {
		const currency = await this.currencyMasterRepo.findOneBy({ countryCode });
		if (!currency) {
			throw new HttpException({ status: ResponseData["INVALID_CURRENCY"] }, HttpStatus.OK);
		}
		return currency;
	}
}
