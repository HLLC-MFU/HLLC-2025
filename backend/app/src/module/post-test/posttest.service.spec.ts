import { Test, TestingModule } from '@nestjs/testing';
import { PosttestService } from './post-test.service';

describe('PosttestService', () => {
  let service: PosttestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PosttestService],
    }).compile();

    service = module.get<PosttestService>(PosttestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
