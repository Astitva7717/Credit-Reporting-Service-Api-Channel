import { Test, TestingModule } from "@nestjs/testing";
import { DocDaoService } from "./doc-dao.service";

describe("DocDaoService", () => {
	let service: DocDaoService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [DocDaoService]
		}).compile();

		service = module.get<DocDaoService>(DocDaoService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
