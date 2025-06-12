import { Test, TestingModule } from '@nestjs/testing';
import { PreTestAnswerService } from './pre-test-answer.service';

describe('PreTestAnswerService', () => {
  let service: PreTestAnswerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PreTestAnswerService],
    }).compile();

    service = module.get<PreTestAnswerService>(PreTestAnswerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
