import { Test, TestingModule } from '@nestjs/testing';
import { StipeService } from './stipe.service';

describe('StipeService', () => {
  let service: StipeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StipeService],
    }).compile();

    service = module.get<StipeService>(StipeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
