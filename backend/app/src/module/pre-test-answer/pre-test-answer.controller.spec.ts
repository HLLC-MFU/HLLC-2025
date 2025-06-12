import { Test, TestingModule } from '@nestjs/testing';
import { PreTestAnswerController } from './pre-test-answer.controller';
import { PreTestAnswerService } from './pre-test-answer.service';

describe('PreTestAnswerController', () => {
  let controller: PreTestAnswerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PreTestAnswerController],
      providers: [PreTestAnswerService],
    }).compile();

    controller = module.get<PreTestAnswerController>(PreTestAnswerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
