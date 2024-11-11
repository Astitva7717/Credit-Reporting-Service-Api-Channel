import { Test, TestingModule } from "@nestjs/testing";
import { PlaidAuthDaoService } from "./plaid-auth-dao.service";

describe("PlaidAuthDaoService", () => {
	let service: PlaidAuthDaoService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [PlaidAuthDaoService]
		}).compile();

		service = module.get<PlaidAuthDaoService>(PlaidAuthDaoService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
