import { Test, TestingModule } from "@nestjs/testing";
import { AliasDaoService } from "./alias-dao.service";

describe("AliasDaoService", () => {
	let service: AliasDaoService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [AliasDaoService]
		}).compile();

		service = module.get<AliasDaoService>(AliasDaoService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
