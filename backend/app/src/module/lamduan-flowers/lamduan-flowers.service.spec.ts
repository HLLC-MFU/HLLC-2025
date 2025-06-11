import { Test, TestingModule } from '@nestjs/testing';
import { LamduanFlowersService } from './lamduan-flowers.service';

describe('LamduanFlowersService', () => {
  let service: LamduanFlowersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LamduanFlowersService],
    }).compile();

    service = module.get<LamduanFlowersService>(LamduanFlowersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
