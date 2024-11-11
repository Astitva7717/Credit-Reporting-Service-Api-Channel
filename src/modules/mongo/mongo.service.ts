import { Injectable } from "@nestjs/common";
import VariablesConstant from "src/utils/variables-constant";
import { MongoDaoService } from "../dao/mongo-dao/mongo-dao.service";
import { AppLoggerService } from "src/app-logger/app-logger.service";
import { AppLoggerDto } from "@app-logger/app-logger.dto";

@Injectable()
export class MongoService {
	constructor(private appLoggerService: AppLoggerService, private mongoDaoService: MongoDaoService) {}

	async mongoLogging(request: object, mongoObject: any, type: string, result: object, responseTime: Date) {
		const appLoggerDto: AppLoggerDto = new AppLoggerDto(
			VariablesConstant.INFO,
			"mongo_insertion",
			type,
			"MongoServiceService",
			"mongoLogging",
			null
		);
		appLoggerDto.addMethodAndRequest("mongo insertion", null);
		appLoggerDto.addData(
			"request: " + (request ? JSON.stringify(request) : null),
			"mongoObject : " + (mongoObject ? JSON.stringify(mongoObject) : null),
			"result : " + (result ? JSON.stringify(result) : null)
		);
		this.appLoggerService.writeLog(appLoggerDto);
		if (`${process.env.IS_MONGO_ENABLE}` == "true" && mongoObject) {
			await this.mongoInsertion(type, mongoObject, result, request, responseTime);
		} else {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.INFO,
				"mongo_update_error",
				type,
				"MongoServiceService",
				"mongoLogging",
				null
			);
			appLoggerDto.addMethodAndRequest("error in mongo update due to mongo enable false or null mongo object", null);
			appLoggerDto.addData(
				"request: " + (request ? JSON.stringify(request) : null),
				"mongoObject : " + (mongoObject ? JSON.stringify(mongoObject) : null),
				"result : " + (result ? JSON.stringify(result) : null),
				"isMongoEnable :" + `${process.env.IS_MONGO_ENABLE}`
			);
			this.appLoggerService.writeLog(appLoggerDto);
		}
	}

	async mongoInsertion(type: string, mongoObject, result: object, request: object, responseTime: Date) {
		try {
			switch (type) {
				case VariablesConstant.MONGO_BACKOFFICE_APIS:
					await this.mongoDaoService.saveMongoBackofficeApis(mongoObject.update(result, responseTime));
					break;
				case VariablesConstant.COMMON_MONGO_ENTITY:
					await this.mongoDaoService.saveCommonMongoEntity(mongoObject.update(result, responseTime));
					break;
				case VariablesConstant.CASHIER_API_MONGO_ENTITY:
					await this.mongoDaoService.saveCashierApiMongoEnitiy(mongoObject.update(result, responseTime));
					break;
				default: {
					const appLoggerDto: AppLoggerDto = new AppLoggerDto(
						VariablesConstant.WARNING,
						"mongo_insert_type_does_not_exist",
						type,
						"MongoServiceService",
						"mongoLogging",
						null
					);
					appLoggerDto.addMethodAndRequest("error in mongo update", null);
					appLoggerDto.addData(
						"request: " + (request ? JSON.stringify(request) : null),
						"mongoObject : " + (mongoObject ? JSON.stringify(mongoObject) : null),
						"result : " + (result ? JSON.stringify(result) : null)
					);
					this.appLoggerService.writeLog(appLoggerDto);
				}
			}
		} catch (e) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"mongo_connection_error",
				type,
				"MongoServiceService",
				"mongoLogging",
				e
			);
			appLoggerDto.addMethodAndRequest("error in mongo connection", null);
			appLoggerDto.addData(
				"request: " + (request ? JSON.stringify(request) : null),
				"mongoObject : " + (mongoObject ? JSON.stringify(mongoObject) : null),
				"result : " + (result ? JSON.stringify(result) : null)
			);
			this.appLoggerService.writeLog(appLoggerDto);
		}
	}
}
