import { Test, TestingModule } from "@nestjs/testing";
import { BusinessMasterController } from "./business-master.controller";
import { BusinessMasterService } from "./business-master.service";

describe("BusinessMasterController", () => {
	let controller: BusinessMasterController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [BusinessMasterController],
			providers: [BusinessMasterService]
		}).compile();

		controller = module.get<BusinessMasterController>(BusinessMasterController);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
