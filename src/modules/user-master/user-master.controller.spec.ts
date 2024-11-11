import { Test, TestingModule } from "@nestjs/testing";
import { UserMasterController } from "./user-master.controller";
import { UserMasterService } from "./user-master.service";

describe("UserMasterController", () => {
	let controller: UserMasterController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UserMasterController],
			providers: [UserMasterService]
		}).compile();

		controller = module.get<UserMasterController>(UserMasterController);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
