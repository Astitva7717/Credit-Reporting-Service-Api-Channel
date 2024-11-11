import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { ConsumerSubscribeTopics } from "@nestjs/microservices/external/kafka.interface";
import { Consumer, ConsumerRunConfig, Kafka } from "kafkajs";

import { ConfigService } from "../../config";
import VariablesConstant from "@utils/variables-constant";
import { sleep } from "@utils/sleep";
import { AppLoggerService } from "src/app-logger/app-logger.service";
import { AppLoggerDto } from "@app-logger/app-logger.dto";

@Injectable()
export class ConsumerService implements OnApplicationShutdown {
	private readonly kafka: Kafka;
	private readonly consumers: Consumer[] = [];

	constructor(private appLoggerService: AppLoggerService, private readonly configService: ConfigService) {
		this.kafka = new Kafka({ brokers: [`${configService.get("KAFKA_BROKER")}`] });
	}

	async consume(topic: ConsumerSubscribeTopics, config: ConsumerRunConfig) {
		const consumer = this.kafka.consumer({
			groupId: `${this.configService.get("KAFKA_GROUP_ID")}`
		});
		this.connect(consumer);
		await consumer.subscribe(topic);
		await consumer.run(config);
		this.consumers.push(consumer);
	}

	async onApplicationShutdown() {
		for (const consumer of this.consumers) {
			await consumer.disconnect();
		}
	}

	async connect(consumer: any) {
		try {
			await consumer.connect();
		} catch (err) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"failed_to_connect_to_Kafka",
				"kafka_consumer_service",
				"ConsumerService",
				"connect",
				err
			);
			this.appLoggerService.writeLog(appLoggerDto);
			await sleep(5000);
			await this.connect(consumer);
		}
	}
}
