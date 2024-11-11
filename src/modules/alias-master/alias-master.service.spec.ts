import { Test, TestingModule } from "@nestjs/testing";
import { AliasMasterService } from "./alias-master.service";

describe("AliasMasterService", () => {
	let service: AliasMasterService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [AliasMasterService]
		}).compile();

		service = module.get<AliasMasterService>(AliasMasterService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
