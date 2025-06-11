import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentAnswersService } from './assessment-answers.service';

describe('AssessmentAnswersService', () => {
  let service: AssessmentAnswersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssessmentAnswersService],
    }).compile();

    service = module.get<AssessmentAnswersService>(AssessmentAnswersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
