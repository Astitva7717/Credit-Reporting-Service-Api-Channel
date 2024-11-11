import { AppLoggerDto } from "@app-logger/app-logger.dto";
import { KafkaRequestDaoService } from "@modules/dao/kafka-request-dao/kafka-request-dao.service";
import { PackageService } from "@modules/package/package.service";
import { Injectable } from "@nestjs/common";
import VariablesConstant from "@utils/variables-constant";
import { AppLoggerService } from "src/app-logger/app-logger.service";

@Injectable()
export class StipeService {
	constructor(
		private readonly packageService: PackageService,
		private kafkaRequestDao: KafkaRequestDaoService,
		private appLoggerService: AppLoggerService
	) {}

	async stripePaymentDone(message: any) {
		let kafkaRequest = null;
		try {
			kafkaRequest = await this.kafkaRequestDao.save({
				topic: VariablesConstant.STRIPE_SUCCESS,
				request: message,
				status: "IN_PROGRESS",
				retryCount: 0
			});
			const requestData = message;
			await this.packageService.purchaseInitiateFromKafka(JSON.parse(requestData));
			kafkaRequest.status = "DONE";
			kafkaRequest.errorResponse = null;
			await this.kafkaRequestDao.save(kafkaRequest);
		} catch (e) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"error_in_kafka_stripe_success",
				"kafka_stripe",
				"StripeService",
				"stripePaymentDone",
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
