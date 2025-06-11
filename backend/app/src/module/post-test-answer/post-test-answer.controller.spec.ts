import { Test, TestingModule } from '@nestjs/testing';
import { PostTestAnswerController } from './post-test-answer.controller';
import { PostTestAnswerService } from './post-test-answer.service';

describe('PostTestAnswerController', () => {
  let controller: PostTestAnswerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostTestAnswerController],
      providers: [PostTestAnswerService],
    }).compile();

    controller = module.get<PostTestAnswerController>(PostTestAnswerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
