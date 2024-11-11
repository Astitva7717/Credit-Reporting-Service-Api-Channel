import { Test, TestingModule } from '@nestjs/testing';
import { MonthlyProofService } from './monthly-proof.service';

describe('MonthlyProofService', () => {
  let service: MonthlyProofService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MonthlyProofService],
    }).compile();

    service = module.get<MonthlyProofService>(MonthlyProofService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
