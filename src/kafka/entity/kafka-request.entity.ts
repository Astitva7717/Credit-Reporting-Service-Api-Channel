import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("sb_crs_kafka_request")
export class KafkaRequest {
	@PrimaryGeneratedColumn()
	requestId: number;

	@Column()
	topic: string;

	@Column({ type: "text" })
	request: string;

	@Column({ type: "text", nullable: true })
	errorResponse: string;

	@Column()
	status: string;

	@CreateDateColumn()
	createdAt;

	@UpdateDateColumn()
	updatedAt;

	@Column()
	retryCount: number;

	public constructor(topic, request, status, retryCount) {
		this.topic = topic;
		this.request = request;
		this.status = status;
		this.retryCount = retryCount;
	}
}
