import { Test, TestingModule } from "@nestjs/testing";
import { PackageDaoService } from "./package-dao.service";

describe("PackageDaoService", () => {
	let service: PackageDaoService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [PackageDaoService]
		}).compile();

		service = module.get<PackageDaoService>(PackageDaoService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
