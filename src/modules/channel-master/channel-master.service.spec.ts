import { Test, TestingModule } from "@nestjs/testing";
import { ChannelMasterService } from "./channel-master.service";

describe("ChannelMasterService", () => {
	let service: ChannelMasterService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ChannelMasterService]
		}).compile();

		service = module.get<ChannelMasterService>(ChannelMasterService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
