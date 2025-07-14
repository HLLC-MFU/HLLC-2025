import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  StepAchievement,
  StepAchievementDocument,
} from '../schema/step-achievement.schema';
import {
  StepCounter,
  StepCounterDocument,
} from '../schema/step-counter.schema';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class StepWatchService {
  constructor(
    @InjectModel(StepCounter.name)
    private readonly stepCounterModel: Model<StepCounterDocument>,
    @InjectModel(StepAchievement.name)
    private readonly stepAchievementModel: Model<StepAchievementDocument>,
  ) {}

  @Cron(CronExpression.EVERY_12_HOURS)
  async handleCron() {
    try {
      // หา StepCounter ที่ยังไม่ completeStatus
      const incompleteSteps = await this.stepCounterModel.find({
        completeStatus: false,
      });

      for (const stepCounter of incompleteSteps) {
        const totalStep = stepCounter.steps.reduce(
          (sum, step) => sum + step.step,
          0,
        );

        const achievement = await this.stepAchievementModel
          .findById(stepCounter.achievement)
          .lean();

        if (!achievement) continue;

        if (totalStep >= achievement.achievement) {
          // นับคนที่ทำครบแล้วและมี rank
          const countCompleted = await this.stepCounterModel.countDocuments({
            achievement: stepCounter.achievement,
            completeStatus: true,
            rank: { $ne: null },
          });

          const pinnedRank = countCompleted + 1;

          await this.stepCounterModel.updateOne(
            { _id: stepCounter._id },
            {
              $set: {
                completeStatus: true,
                rank: pinnedRank,
              },
            },
          );
        }
      }
    } catch (error) {
      console.error('[StepWatchService][Cron] Error:', error);
    }
  }
}
