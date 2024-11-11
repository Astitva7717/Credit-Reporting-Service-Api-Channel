import { Test, TestingModule } from "@nestjs/testing";
import { SchedulerDaoService } from "./scheduler-dao.service";

describe("SchedulerDaoService", () => {
	let service: SchedulerDaoService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [SchedulerDaoService]
		}).compile();

		service = module.get<SchedulerDaoService>(SchedulerDaoService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
