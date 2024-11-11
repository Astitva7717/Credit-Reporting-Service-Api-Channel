import { Test, TestingModule } from "@nestjs/testing";
import { KafkaRequestDaoService } from "./kafka-request-dao.service";

describe("KafkaRequestDaoService", () => {
	let service: KafkaRequestDaoService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [KafkaRequestDaoService]
		}).compile();

		service = module.get<KafkaRequestDaoService>(KafkaRequestDaoService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
