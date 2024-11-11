import { Test, TestingModule } from "@nestjs/testing";
import { BackOfficeMasterService } from "./back-office-master.service";

describe("BackOfficeMasterService", () => {
	let service: BackOfficeMasterService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [BackOfficeMasterService]
		}).compile();

		service = module.get<BackOfficeMasterService>(BackOfficeMasterService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
