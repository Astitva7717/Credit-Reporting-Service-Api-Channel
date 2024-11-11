import { Test, TestingModule } from '@nestjs/testing';
import { BlogDaoService } from './blog-dao.service';

describe('BlogDaoService', () => {
  let service: BlogDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlogDaoService],
    }).compile();

    service = module.get<BlogDaoService>(BlogDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
