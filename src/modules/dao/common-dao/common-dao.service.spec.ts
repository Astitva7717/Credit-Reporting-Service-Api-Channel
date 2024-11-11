import { Test, TestingModule } from "@nestjs/testing";
import { CommonDaoService } from "./common-dao.service";

describe("CommonDaoService", () => {
	let service: CommonDaoService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [CommonDaoService]
		}).compile();

		service = module.get<CommonDaoService>(CommonDaoService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
