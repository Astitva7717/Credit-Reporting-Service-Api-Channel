import { Test, TestingModule } from "@nestjs/testing";
import { SchedulerHelperService } from "./scheduler-helper.service";

describe("SchedulerHelperService", () => {
	let service: SchedulerHelperService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [SchedulerHelperService]
		}).compile();

		service = module.get<SchedulerHelperService>(SchedulerHelperService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
