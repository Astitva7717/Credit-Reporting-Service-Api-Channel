import { Test, TestingModule } from '@nestjs/testing';
import { MonthlyProofController } from './monthly-proof.controller';
import { MonthlyProofService } from './monthly-proof.service';

describe('MonthlyProofController', () => {
  let controller: MonthlyProofController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonthlyProofController],
      providers: [MonthlyProofService],
    }).compile();

    controller = module.get<MonthlyProofController>(MonthlyProofController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
