import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ValidationBean } from "src/utils/common-entities/validation-schema-entity";
import { Repository } from "typeorm";

@Injectable()
export class ValidationDaoService {
	constructor(
		@InjectRepository(ValidationBean)
		private validationRepo: Repository<ValidationBean>
	) {}

	async getRequiredSchema(service: string) {
		const validationBean = await this.validationRepo.findOneBy({
			serviceName: service
		});
		if (validationBean) {
			return validationBean.requiredSchema;
		}
		return null;
	}

	async getAllValidationBean() {
		return await this.validationRepo.find();
	}
}
