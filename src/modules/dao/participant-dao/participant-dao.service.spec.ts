import { Test, TestingModule } from "@nestjs/testing";
import { ParticipantDaoService } from "./participant-dao.service";

describe("ParticipantDaoService", () => {
	let service: ParticipantDaoService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ParticipantDaoService]
		}).compile();

		service = module.get<ParticipantDaoService>(ParticipantDaoService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
