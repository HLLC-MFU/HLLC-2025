import { Test, TestingModule } from '@nestjs/testing';
import { StepAchievementService } from './step-achievement.service';

describe('StepAchievementService', () => {
  let service: StepAchievementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StepAchievementService],
    }).compile();

    service = module.get<StepAchievementService>(StepAchievementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
