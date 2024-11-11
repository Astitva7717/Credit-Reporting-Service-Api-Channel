import { Test, TestingModule } from '@nestjs/testing';
import { DisputeDaoService } from './dispute-dao.service';

describe('DisputeDaoService', () => {
  let service: DisputeDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisputeDaoService],
    }).compile();

    service = module.get<DisputeDaoService>(DisputeDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
