import { Test, TestingModule } from "@nestjs/testing";
import { BusinessDaoService } from "./business-dao.service";

describe("BusinessDaoService", () => {
	let service: BusinessDaoService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [BusinessDaoService]
		}).compile();

		service = module.get<BusinessDaoService>(BusinessDaoService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
