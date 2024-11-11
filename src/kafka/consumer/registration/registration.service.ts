import { Injectable } from "@nestjs/common";
import { KafkaRequestDaoService } from "src/modules/dao/kafka-request-dao/kafka-request-dao.service";
import { UserMasterService } from "src/modules/user-master/user-master.service";
import VariablesConstant from "src/utils/variables-constant";
import { AppLoggerService } from "src/app-logger/app-logger.service";
import { AppLoggerDto } from "@app-logger/app-logger.dto";

require("dotenv").config();

@Injectable()
export class RegistrationService {
	constructor(
		private kafkaRequestDao: KafkaRequestDaoService,
		private userService: UserMasterService,
		private appLoggerService: AppLoggerService
	) {}

	async registerUser(message) {
		let kafkaRequest = null;
		try {
			kafkaRequest = await this.kafkaRequestDao.save({
				topic: VariablesConstant.REGISTRATION,
				request: message,
				status: "IN_PROGRESS",
				retryCount: 0
			});
			const requestData = message;
			await this.userService.registerUser(JSON.parse(requestData));
			kafkaRequest.status = "DONE";
			kafkaRequest.errorResponse = null;
			await this.kafkaRequestDao.save(kafkaRequest);
		} catch (e) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"error_in_kafka_registration_consumer",
				"kafka_registration_consumer",
				"RegistrationService",
				"registerUser",
				e
			);
			appLoggerDto.addData("kafkaRequest: " + JSON.stringify(kafkaRequest));
			this.appLoggerService.writeLog(appLoggerDto);
			kafkaRequest.status = VariablesConstant.ERROR;
			kafkaRequest.errorResponse = e?.response?.status?.errorMessage ? e.response.status.errorMessage : e.message;
			await this.kafkaRequestDao.save(kafkaRequest);
		}
	}
}
