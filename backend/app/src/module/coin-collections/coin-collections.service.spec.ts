import { Test, TestingModule } from '@nestjs/testing';
import { CoinCollectionsService } from './coin-collections.service';

describe('CoinCollectionsService', () => {
  let service: CoinCollectionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoinCollectionsService],
    }).compile();

    service = module.get<CoinCollectionsService>(CoinCollectionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
