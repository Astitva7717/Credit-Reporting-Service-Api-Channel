import { Test, TestingModule } from '@nestjs/testing';
import { ReportingDaoService } from './reporting-dao.service';

describe('ReportingDaoService', () => {
  let service: ReportingDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportingDaoService],
    }).compile();

    service = module.get<ReportingDaoService>(ReportingDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
