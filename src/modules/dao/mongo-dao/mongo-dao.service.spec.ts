import { Test, TestingModule } from "@nestjs/testing";
import { MongoDaoService } from "./mongo-dao.service";

describe("MongoDaoService", () => {
	let service: MongoDaoService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [MongoDaoService]
		}).compile();

		service = module.get<MongoDaoService>(MongoDaoService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
