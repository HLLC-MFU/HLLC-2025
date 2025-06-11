import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentAnswersController } from './assessment-answers.controller';
import { AssessmentAnswersService } from './assessment-answers.service';

describe('AssessmentAnswersController', () => {
  let controller: AssessmentAnswersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentAnswersController],
      providers: [AssessmentAnswersService],
    }).compile();

    controller = module.get<AssessmentAnswersController>(AssessmentAnswersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
