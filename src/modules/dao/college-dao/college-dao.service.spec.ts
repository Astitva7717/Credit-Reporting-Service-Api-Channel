import { Test, TestingModule } from '@nestjs/testing';
import { CollegeDaoService } from './college-dao.service';

describe('CollegeDaoService', () => {
  let service: CollegeDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CollegeDaoService],
    }).compile();

    service = module.get<CollegeDaoService>(CollegeDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
