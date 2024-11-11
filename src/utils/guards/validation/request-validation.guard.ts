import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { ValidationDaoService } from "src/modules/dao/validation-dao/validation-dao.service";
import { ValidateStructureService } from "src/utils/common/validate-structure/validate-structure.service";

@Injectable()
export class RequetsValidationGuard implements CanActivate {
	constructor(private validationSchemaDao: ValidationDaoService, private validateStructure: ValidateStructureService) {}
	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		return this.checkValidations(context);
	}

	async checkValidations(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const requestURI = request.url;
		const path = requestURI.split("/");
		let serviceName = path[path.length - 1];
		let requestData = null;

		if (request.method === "POST") {
			requestData = request.body;
		} else {
			serviceName = serviceName?.split("?")[0];
			const requestParams = new Map();
			Object.keys(request.query)?.forEach((map) => requestParams.set(map, "" + request.query[map]));
			requestData = requestParams;
		}

		const validationEntitySchema = await this.validationSchemaDao.getRequiredSchema(serviceName);

		if (validationEntitySchema) {
			await this.validateStructure.validate(validationEntitySchema, requestData, request.method);
		}

		return true;
	}
}
