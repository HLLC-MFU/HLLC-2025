import { Test, TestingModule } from '@nestjs/testing';
import { CoinCollectionsController } from './coin-collections.controller';
import { CoinCollectionsService } from './coin-collections.service';

describe('CoinCollectionsController', () => {
  let controller: CoinCollectionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoinCollectionsController],
      providers: [CoinCollectionsService],
    }).compile();

    controller = module.get<CoinCollectionsController>(CoinCollectionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
