import { Test, TestingModule } from '@nestjs/testing';
import { PostTestAnswerService } from './post-test-answer.service';

describe('PostTestAnswerService', () => {
  let service: PostTestAnswerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostTestAnswerService],
    }).compile();

    service = module.get<PostTestAnswerService>(PostTestAnswerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
