import { Test, TestingModule } from '@nestjs/testing';
import { MonthlyDocDaoService } from './monthly-doc-dao.service';

describe('MonthlyDocDaoService', () => {
  let service: MonthlyDocDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MonthlyDocDaoService],
    }).compile();

    service = module.get<MonthlyDocDaoService>(MonthlyDocDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
