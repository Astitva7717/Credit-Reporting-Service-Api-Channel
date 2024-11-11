import { Test, TestingModule } from "@nestjs/testing";
import { ValidateStructureService } from "./validate-structure.service";

describe("ValidateStructureService", () => {
	let service: ValidateStructureService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ValidateStructureService]
		}).compile();

		service = module.get<ValidateStructureService>(ValidateStructureService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
