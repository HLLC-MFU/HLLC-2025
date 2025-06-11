import { Test, TestingModule } from '@nestjs/testing';
import { PreTestService } from './pre-test.service';

describe('PreTestService', () => {
  let service: PreTestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PreTestService],
    }).compile();

    service = module.get<PreTestService>(PreTestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
