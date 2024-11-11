import { AppLoggerDto } from "@app-logger/app-logger.dto";
import { Injectable, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import { Kafka, Producer, ProducerRecord } from "kafkajs";
import { AppLoggerService } from "src/app-logger/app-logger.service";
import { ConfigService } from "src/config/config.service";
import { sleep } from "src/utils/sleep";
import VariablesConstant from "src/utils/variables-constant";
@Injectable()
export class ProducerService implements OnModuleInit, OnApplicationShutdown {
	private readonly kafka: Kafka;
	private readonly producer: Producer;
	constructor(private appLoggerService: AppLoggerService, private readonly configService: ConfigService) {
		this.kafka = new Kafka({
			brokers: [`${configService.get("KAFKA_BROKER")}`]
		});
		this.producer = this.kafka.producer();
	}

	async onModuleInit() {
		await this.connect(this.producer);
	}

	async connect(producer: any) {
		try {
			await producer.connect();
		} catch (err) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"failed_to_connect_to_Kafka",
				"kafka_producer_service",
				"ProducerService",
				"connect",
				err
			);
			this.appLoggerService.writeLog(appLoggerDto);
			await sleep(5000);
			await this.connect(producer);
		}
	}

	async produce(record: ProducerRecord) {
		await this.producer.send(record);
	}

	async onApplicationShutdown(signal?: string) {
		this.producer.disconnect();
	}
}
