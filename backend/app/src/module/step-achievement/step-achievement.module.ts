import { Module } from '@nestjs/common';
import { StepAchievementService } from './step-achievement.service';
import { StepAchievementController } from './step-achievement.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { StepAchievement, StepAchievementSchema } from './schema/step-achievement.schema';

@Module({
  imports: [MongooseModule.forFeature([
    {
      name: StepAchievement.name,
      schema: StepAchievementSchema
    }
  ])],
  controllers: [StepAchievementController],
  providers: [StepAchievementService],
})
export class StepAchievementModule { }
