import { Module } from "@nestjs/common";
import { ProducerService } from "./producer/producer.service";
import { ConsumerService } from "./consumer/consumer.service";
import { RegistrationService } from "./consumer/registration/registration.service";
import { UtilsModule } from "@utils/utils.module";
import { UpdateService } from "./consumer/update/update.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { KafkaRequest } from "./entity/kafka-request.entity";
import { ConsumerTopicSubscrition } from "./consumer/consumer.topic.subscription";
import { DaoModule } from "@modules/dao/dao.module";
import { KafkaRequestDaoService } from "@modules/dao/kafka-request-dao/kafka-request-dao.service";
import { UserMasterModule } from "@modules/user-master/user-master.module";
import { NotificationProducerService } from "./producer/notification-producer/notification-producer-service";
import { PackageModule } from "@modules/package/package.module";
import { StipeService } from "./consumer/stipe/stipe.service";
import { AppLoggerModule } from "src/app-logger/app-logger.module";

@Module({
	imports: [
		UtilsModule,
		DaoModule,
		TypeOrmModule.forFeature([KafkaRequest]),
		UserMasterModule,
		PackageModule,
		AppLoggerModule
	],
	providers: [
		ConsumerService,
		RegistrationService,
		UpdateService,
		KafkaRequestDaoService,
		ConsumerTopicSubscrition,
		ProducerService,
		NotificationProducerService,
		StipeService
	],
	exports: [
		ConsumerService,
		RegistrationService,
		UpdateService,
		ConsumerTopicSubscrition,
		ProducerService,
		NotificationProducerService,
		StipeService
	]
})
export class KafkaModule {}
