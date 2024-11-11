import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
	BusinessConfigurationMaster,
	Status
} from "src/modules/business-master/entities/business-configuration-master-entity";
import { BusinessMaster } from "src/modules/business-master/entities/business-master.entity";
import { ResponseData } from "src/utils/enums/response";
import { Not, Repository } from "typeorm";

@Injectable()
export class BusinessDaoService {
	constructor(
		@InjectRepository(BusinessMaster)
		private businessRepository: Repository<BusinessMaster>,
		@InjectRepository(BusinessConfigurationMaster)
		private businessConfigurationRepository: Repository<BusinessConfigurationMaster>
	) {}
	async findAll(): Promise<BusinessMaster[]> {
		const result: BusinessMaster[] = await this.businessRepository.findBy({
			status: Status.ACTIVE
		});
		if (!result.length) {
			throw new HttpException({ status: ResponseData["DATA_NOT_FOUND"] }, HttpStatus.OK);
		}
		return result;
	}

	async findByBusinessIdNot(businessId: number) {
		return await this.businessRepository.find({
			where: { status: Status.ACTIVE, businessId: Not(businessId) }
		});
	}

	async findByBusinessIdAndStatus(businessId: number, status: Status): Promise<BusinessMaster> {
		const businessMaster: BusinessMaster = await this.businessRepository.findOneBy({ businessId, status });
		if (!businessMaster) {
			throw new HttpException({ status: ResponseData["INVALID_BUSINESS"] }, HttpStatus.OK);
		}
		return businessMaster;
	}

	async findByBusinessId(businessId: number): Promise<BusinessConfigurationMaster[]> {
		return await this.businessConfigurationRepository.findBy({ businessId });
	}

	async fetchAll(): Promise<any[]> {
		const result = await this.businessRepository.findBy({
			status: Status.ACTIVE
		});
		if (!result.length) throw new HttpException({ status: ResponseData["DATA_NOT_FOUND"] }, HttpStatus.OK);

		return result;
	}

	async existsByBusinessId(businessId: number): Promise<boolean> {
		if (await this.businessRepository.findOneBy({ businessId })) {
			throw new HttpException({ status: ResponseData["BUSINESS_ALREADY_REGISTERED"] }, HttpStatus.OK);
		}
		return false;
	}

	async existsByBusinessCode(businessCode: string) {
		if (await this.businessRepository.findOneBy({ businessCode })) {
			throw new HttpException({ status: ResponseData["BUSINESS_CODE_ALREADY_REGISTERED"] }, HttpStatus.OK);
		}
		return false;
	}

	async existsByMobileCodeAndMobileNumber(mobileCode: string, mobileNumber: string) {
		if (await this.businessRepository.findOneBy({ mobileCode, mobileNumber })) {
			throw new HttpException({ status: ResponseData["BUSINESS_MOBILE_ALREADY_REGISTERED"] }, HttpStatus.OK);
		}
		return false;
	}

	async existsByEmailId(emailId: string) {
		if (await this.businessRepository.findOneBy({ emailId })) {
			throw new HttpException({ status: ResponseData["BUSINESS_EMAIL_ALREADY_REGISTERED"] }, HttpStatus.OK);
		}
		return false;
	}

	async save(businessMaster: BusinessMaster) {
		return await this.businessRepository.save(businessMaster);
	}

	async saveAllBusinessConfigs(
		businessConfigurationMasterList: BusinessConfigurationMaster[]
	): Promise<BusinessConfigurationMaster[]> {
		return await this.businessConfigurationRepository.save(businessConfigurationMasterList);
	}

	async findBusinessMasterByBusinessId(businessId) {
		const businessMaster = await this.businessRepository.findOneBy({
			businessId
		});
		if (!businessMaster) {
			throw new HttpException({ status: ResponseData["INVALID_BUSINESS"] }, HttpStatus.OK);
		}
		return businessMaster;
	}

	async getAllByBusinessConfigurations(): Promise<BusinessConfigurationMaster[]> {
		return await this.businessConfigurationRepository.find({
			where: {
				status: Status.ACTIVE
			}
		});
	}
}
