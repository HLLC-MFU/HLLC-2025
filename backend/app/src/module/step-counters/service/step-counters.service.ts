import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  StepCounter,
  StepCounterDocument,
} from '../schema/step-counter.schema';
import { Model, Types } from 'mongoose';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { User, UserDocument } from '../../users/schemas/user.schema';

import {
  StepAchievement,
  StepAchievementDocument,
} from '../schema/step-achievement.schema';
@Injectable()
export class StepCountersService {
  constructor(
    @InjectModel(StepCounter.name)
    private stepCounterModel: Model<StepCounterDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(StepAchievement.name)
    private stepAchievementModel: Model<StepAchievementDocument>,
  ) {}

  async getRegisteredDevices(userId: string) {
    const user = await findOrThrow(this.userModel, userId, 'User not found');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const stepCounters = await this.stepCounterModel
      .find({ user: user._id })
      .select('deviceId completeStatus steps')
      .lean();
    if (stepCounters.length === 0) {
      throw new NotFoundException('No step counters registered for this user');
    }
    return stepCounters.map((sc) => ({
      deviceId: sc.deviceId,
      completeStatus: sc.completeStatus,
      steps: sc.steps.length,
    }));
  }

  async registerDevice(userId: string, deviceId: string) {
    const user = await findOrThrow(this.userModel, userId, 'User not found');

    // ❌ If user already has *any* step counter — block new registration
    const existingCounters = await this.stepCounterModel.find({
      user: user._id,
    });

    const isSameDeviceRegistered = existingCounters.some(
      (counter) => counter.deviceId === deviceId,
    );

    if (isSameDeviceRegistered) {
      return await this.stepCounterModel.findOne({
        user: user._id,
        deviceId,
      });
    }

    if (existingCounters.length > 0) {
      throw new ForbiddenException(
        'User already registered a different device',
      );
    }

    // ✅ Allow first-time registration
    const achievementId = await this.stepAchievementModel
      .findOne({})
      .then((a) => a?._id || null);

    const newStepCounter = new this.stepCounterModel({
      user: user._id,
      deviceId,
      achievement: achievementId,
      completeStatus: false,
      steps: [],
    });

    return await newStepCounter.save();
  }

  async updateDevice(userId: string, deviceId: string) {
    const user = await findOrThrow(this.userModel, userId, 'User not found');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingCounter = await this.stepCounterModel.findOne({
      user: user._id,
    });

    if (!existingCounter) {
      throw new NotFoundException('Step counter not found for this user');
    }

    // Get today's date at 00:00:00 for accurate date matching
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's step entry (optional chaining and fallback)
    const todayEntry = existingCounter.steps.find((entry) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    if (todayEntry) {
      const stepToRemove = todayEntry.step;

      existingCounter.steps = existingCounter.steps.filter((entry) => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() !== today.getTime();
      });

      existingCounter.steps = existingCounter.steps.map((entry) => ({
        ...entry,
        totalStep: Math.max(0, (entry.totalStep || 0) - stepToRemove),
      }));
    }

    existingCounter.deviceId = deviceId;

    return await existingCounter.save();
  }

  async collectStep(
    userId: string,
    deviceId: string,
    stepCount: number,
    date: string | Date,
  ) {
    // Validate user existence
    const user = await findOrThrow(this.userModel, userId, 'User not found');
    if (!user) throw new NotFoundException('User not found');

    // Find all step counters for user
    const stepCounters = await this.stepCounterModel.find({ user: user._id });
    if (stepCounters.length === 0) {
      throw new NotFoundException('Step counter not found for this user');
    }

    // Find step counter matching deviceId
    const stepCounter = stepCounters.find((sc) => sc.deviceId === deviceId);
    if (!stepCounter) {
      throw new BadRequestException('Invalid deviceId for this user');
    }

    // Normalize date to midnight
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Check if a step entry for this date exists
    const existingIndex = stepCounter.steps.findIndex((entry) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === targetDate.getTime();
    });

    if (existingIndex !== -1) {
      // Update existing step entry
      stepCounter.steps[existingIndex].step = stepCount;
      stepCounter.steps[existingIndex].updatedAt = new Date();
    } else {
      // Push new step entry
      stepCounter.steps.push({
        step: stepCount,
        totalStep: 0,
        date: targetDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Sort steps by date ascending
    stepCounter.steps.sort((a, b) => +new Date(a.date) - +new Date(b.date));

    // Recalculate running total steps
    let runningTotal = 0;
    for (const s of stepCounter.steps) {
      runningTotal += s.step;
      s.totalStep = runningTotal;
    }

    const totalStep = runningTotal;

    // Check achievement if stepCounter is not complete or rank not set
    if (!stepCounter.completeStatus || typeof stepCounter.rank !== 'number') {
      // Validate achievement ID before querying
      if (
        stepCounter.achievement &&
        Types.ObjectId.isValid(stepCounter.achievement)
      ) {
        const achievement = await this.stepAchievementModel
          .findById(stepCounter.achievement)
          .lean();

        if (achievement && totalStep >= achievement.achievement) {
          // Count how many completed with rank for this achievement
          const alreadyCompleted = await this.stepCounterModel.countDocuments({
            achievement: stepCounter.achievement,
            completeStatus: true,
            rank: { $ne: null },
          });

          stepCounter.completeStatus = true;
          stepCounter.rank = alreadyCompleted + 1;
        }
      }
    }

    // Save updated stepCounter and return
    return await stepCounter.save();
  }

  async leaderboard(
    scope: 'all' | 'school' | 'date',
    options: {
      schoolId?: string;
      date?: string | Date;
      page?: number;
      pageSize?: number;
    } = {},
  ) {
    const { schoolId, date, page = 1, pageSize = 20 } = options;
    const skip = (page - 1) * pageSize;

    let stepCounters = await this.stepCounterModel
      .find({})
      .populate({
        path: 'user',
        populate: {
          path: 'metadata.major.school',
          model: 'School',
        },
      })
      .lean();

    // 🔍 Filter by School
    if (scope === 'school') {
      if (!schoolId) throw new BadRequestException('Missing schoolId');
      stepCounters = stepCounters.filter((sc) => {
        const user = sc.user as {
          metadata?: { major?: { school?: { _id?: unknown } } };
        };
        const school = user?.metadata?.major?.school;
        return school && school._id?.toString() === schoolId;
      });
    }

    // 🔍 Filter by Date (same day)
    if (scope === 'date') {
      if (!date) throw new BadRequestException('Missing date');
      const target = new Date(date);
      const targetDateStr = target.toISOString().split('T')[0];

      stepCounters = stepCounters.map((sc) => {
        const stepsOnDate = (sc.steps || []).filter((s) => {
          const stepDate = new Date(s.date).toISOString().split('T')[0];
          return stepDate === targetDateStr;
        });

        const totalStep = stepsOnDate.reduce(
          (sum, s) => sum + (s.step || 0),
          0,
        );

        return { ...sc, totalStep };
      });
    } else {
      // ⬅️ Default: all step
      stepCounters = stepCounters.map((sc) => ({
        ...sc,
        totalStep: (sc.steps || []).reduce((sum, s) => sum + (s.step || 0), 0),
      }));
    }

    // 🏁 Separate complete & in-progress
    const completed = stepCounters
      .filter((sc) => sc.completeStatus && typeof sc.rank === 'number')
      .sort((a, b) => a.rank - b.rank);

    const inProgress = stepCounters
      .filter((sc) => !sc.completeStatus)
      .map((sc) => ({
        ...sc,
        totalStep: (sc.steps || []).reduce((sum, s) => sum + (s.step || 0), 0),
      }))
      .sort((a, b) => b.totalStep - a.totalStep);

    const combined = [...completed, ...inProgress];

    return {
      data: combined.slice(skip, skip + pageSize),
      metadata: {
        total: combined.length,
        page,
        pageSize,
        scope,
        schoolId,
        date: date ? new Date(date).toISOString().split('T')[0] : null,
      },
    };
  }

  async myleaderboard(
    scope: 'all' | 'school' | 'date',
    options: {
      schoolId?: string;
      date?: string | Date;
      page?: number;
      pageSize?: number;
      userId?: string;
    } = {},
  ) {
    const { schoolId, date, page = 1, pageSize = 20, userId } = options;
    const skip = (page - 1) * pageSize;

    let stepCounters = await this.stepCounterModel
      .find({})
      .populate({
        path: 'user',
        select: 'name metadata.major username',
        populate: {
          path: 'metadata.major.school',
          model: 'School',
        },
      })
      .lean();

    if (scope === 'school') {
      if (!schoolId) throw new BadRequestException('Missing schoolId');
      stepCounters = stepCounters.filter((sc) => {
        const user = sc.user as {
          metadata?: { major?: { school?: { _id?: unknown } } };
        };
        const school = user?.metadata?.major?.school;
        return school && school._id?.toString() === schoolId;
      });
    }

    if (scope === 'date') {
      if (!date) throw new BadRequestException('Missing date');
      const target = new Date(date);
      const targetDateStr = target.toISOString().split('T')[0];

      stepCounters = stepCounters.map((sc) => {
        const stepsOnDate = (sc.steps || []).filter((s) => {
          const stepDate = new Date(s.date).toISOString().split('T')[0];
          return stepDate === targetDateStr;
        });

        const totalStep = stepsOnDate.reduce(
          (sum, s) => sum + (s.step || 0),
          0,
        );

        return { ...sc, totalStep };
      });
    } else {
      stepCounters = stepCounters.map((sc) => ({
        ...sc,
        totalStep: (sc.steps || []).reduce((sum, s) => sum + (s.step || 0), 0),
      }));
    }

    const completed = stepCounters
      .filter((sc) => sc.completeStatus && typeof sc.rank === 'number')
      .sort((a, b) => a.rank - b.rank);

    const inProgress = stepCounters
      .filter((sc) => !sc.completeStatus)
      .map((sc) => ({
        ...sc,
        totalStep: (sc.steps || []).reduce((sum, s) => sum + (s.step || 0), 0),
      }))
      .sort((a, b) => b.totalStep - a.totalStep);

    const combined = [...completed, ...inProgress];

    // Assign computed rank
    const combinedWithRank = combined.map((sc, idx) => ({
      ...sc,
      computedRank: idx + 1,
    }));

    // Find current user's rank if userId provided
    const myRank = userId
      ? combinedWithRank.find((sc) => sc.user?._id?.toString() === userId)
      : null;

    return {
      data: combinedWithRank.slice(skip, skip + pageSize),
      metadata: {
        total: combinedWithRank.length,
        page,
        pageSize,
        scope,
        schoolId,
        date: date ? new Date(date).toISOString().split('T')[0] : null,
      },
      myRank: myRank
        ? {
            rank: myRank.computedRank,
            data: myRank,
          }
        : null,
    };
  }
}
