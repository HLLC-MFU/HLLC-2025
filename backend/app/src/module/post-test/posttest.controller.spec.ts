import { Test, TestingModule } from '@nestjs/testing';
import { PosttestController } from './post-test.controller';
import { PosttestService } from './post-test.service';

describe('PosttestController', () => {
  let controller: PosttestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosttestController],
      providers: [PosttestService],
    }).compile();

    controller = module.get<PosttestController>(PosttestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
