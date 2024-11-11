import { Test, TestingModule } from "@nestjs/testing";
import { AliasMasterController } from "./alias-master.controller";
import { AliasMasterService } from "./alias-master.service";

describe("AliasMasterController", () => {
	let controller: AliasMasterController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AliasMasterController],
			providers: [AliasMasterService]
		}).compile();

		controller = module.get<AliasMasterController>(AliasMasterController);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
