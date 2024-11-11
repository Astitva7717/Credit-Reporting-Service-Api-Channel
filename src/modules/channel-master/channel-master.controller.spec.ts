import { Test, TestingModule } from "@nestjs/testing";
import { ChannelMasterController } from "./channel-master.controller";
import { ChannelMasterService } from "./channel-master.service";

describe("ChannelMasterController", () => {
	let controller: ChannelMasterController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ChannelMasterController],
			providers: [ChannelMasterService]
		}).compile();

		controller = module.get<ChannelMasterController>(ChannelMasterController);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
