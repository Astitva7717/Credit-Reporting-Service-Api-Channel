import { Test, TestingModule } from "@nestjs/testing";
import { ValidationDaoService } from "./validation-dao.service";

describe("ValidationDaoService", () => {
	let service: ValidationDaoService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ValidationDaoService]
		}).compile();

		service = module.get<ValidationDaoService>(ValidationDaoService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
