import { Test, TestingModule } from '@nestjs/testing';
import { LamduanFlowersController } from './lamduan-flowers.controller';
import { LamduanFlowersService } from './lamduan-flowers.service';

describe('LamduanFlowersController', () => {
  let controller: LamduanFlowersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LamduanFlowersController],
      providers: [LamduanFlowersService],
    }).compile();

    controller = module.get<LamduanFlowersController>(LamduanFlowersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
