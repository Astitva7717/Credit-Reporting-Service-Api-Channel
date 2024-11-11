import { Test, TestingModule } from "@nestjs/testing";
import { BackOfficeMasterController } from "./back-office-master.controller";
import { BackOfficeMasterService } from "./back-office-master.service";

describe("BackOfficeMasterController", () => {
	let controller: BackOfficeMasterController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [BackOfficeMasterController],
			providers: [BackOfficeMasterService]
		}).compile();

		controller = module.get<BackOfficeMasterController>(BackOfficeMasterController);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
