import { Test, TestingModule } from "@nestjs/testing";
import { ChannelDaoService } from "./channel-dao.service";

describe("ChannelDaoService", () => {
	let service: ChannelDaoService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ChannelDaoService]
		}).compile();

		service = module.get<ChannelDaoService>(ChannelDaoService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
