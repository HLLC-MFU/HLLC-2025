import { Test, TestingModule } from '@nestjs/testing';
import { StepAchievementController } from './step-achievement.controller';
import { StepAchievementService } from './step-achievement.service';

describe('StepAchievementController', () => {
  let controller: StepAchievementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StepAchievementController],
      providers: [StepAchievementService],
    }).compile();

    controller = module.get<StepAchievementController>(StepAchievementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
