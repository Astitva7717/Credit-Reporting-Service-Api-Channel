import { Test, TestingModule } from "@nestjs/testing";
import { MasterDataDaoService } from "./master-data-dao.service";

describe("MasterDataDaoService", () => {
	let service: MasterDataDaoService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [MasterDataDaoService]
		}).compile();

		service = module.get<MasterDataDaoService>(MasterDataDaoService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
