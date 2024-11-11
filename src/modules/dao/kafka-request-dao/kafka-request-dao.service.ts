import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { KafkaRequest } from "src/kafka/entity/kafka-request.entity";
import { LessThanOrEqual, Repository } from "typeorm";

@Injectable()
export class KafkaRequestDaoService {
	constructor(
		@InjectRepository(KafkaRequest)
		private kafkaRequestRepo: Repository<KafkaRequest>
	) {}

	async save(kafkaRequest) {
		return await this.kafkaRequestRepo.save(kafkaRequest);
	}

	async findByTopicAndStatusAndRetryCount(reqTopic, reqStatus, reqRetryCount) {
		return await this.kafkaRequestRepo.find({
			where: {
				topic: reqTopic,
				status: reqStatus,
				retryCount: LessThanOrEqual(reqRetryCount)
			}
		});
	}

	async saveAll(kafkaRequestList) {
		return await this.kafkaRequestRepo.save(kafkaRequestList);
	}
}
