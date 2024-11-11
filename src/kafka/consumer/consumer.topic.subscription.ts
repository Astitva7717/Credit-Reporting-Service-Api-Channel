import { Injectable, OnModuleInit } from "@nestjs/common";
import VariablesConstant from "src/utils/variables-constant";
import { RegistrationService } from "./registration/registration.service";
import { ConsumerService } from "./consumer.service";
import { UpdateService } from "./update/update.service";
import { StipeService } from "./stipe/stipe.service";
import { AppLoggerService } from "src/app-logger/app-logger.service";
import { AppLoggerDto } from "@app-logger/app-logger.dto";

@Injectable()
export class ConsumerTopicSubscrition implements OnModuleInit {
	constructor(
		private readonly consumerService: ConsumerService,
		private registrationService: RegistrationService,
		private appLoggerService: AppLoggerService,
		private updateService: UpdateService,
		private readonly stripeService: StipeService
	) {}

	async onModuleInit() {
		const appLoggerDto: AppLoggerDto = new AppLoggerDto(
			VariablesConstant.INFO,
			"kafka_started",
			"kafka_consumer_topic_subscription",
			"ConsumerTopicSubscrition",
			"onModuleInit",
			null
		);

		this.appLoggerService.writeLog(appLoggerDto);
		await this.consumerService.consume(
			{ topics: [VariablesConstant.REGISTRATION, VariablesConstant.PROVIDER_TXN_CONFIRM, VariablesConstant.UPDATE] },
			{
				eachMessage: async ({ topic, partition, message }) => {
					if (topic == VariablesConstant.REGISTRATION) {
						await this.registrationService.registerUser(message.value.toString());
					} else if (topic == VariablesConstant.UPDATE) {
						await this.updateService.updateUser(message.value.toString());
					} else if (topic == VariablesConstant.PROVIDER_TXN_CONFIRM) {
						await this.stripeService.stripePaymentDone(message.value.toString());
					}
				}
			}
		);
	}
}
