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
import { Major, MajorDocument } from 'src/module/majors/schemas/major.schema';
@Injectable()
export class StepCountersService {
  constructor(
    @InjectModel(StepCounter.name)
    private stepCounterModel: Model<StepCounterDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(StepAchievement.name)
    private stepAchievementModel: Model<StepAchievementDocument>,
    @InjectModel(Major.name) private majorModel: Model<MajorDocument>,
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
    type PopulatedUser = {
      _id: Types.ObjectId;
      metadata: {
        major: {
          _id: Types.ObjectId;
          school: {
            _id: Types.ObjectId;
          };
        };
      };
    };

    const user = await this.userModel
      .findById(userId)
      .select('_id major')
      .populate({
        path: 'metadata.major',
        select: '_id school',
        model: 'Major',
        populate: {
          path: 'school',
          select: '_id',
          model: 'School',
        },
      })
      .lean<PopulatedUser>();

    if (
      !user ||
      !user.metadata.major ||
      typeof user.metadata.major !== 'object' ||
      !user.metadata.major.school
    ) {
      throw new NotFoundException('User not found');
    }
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
      school: user.metadata.major.school._id,
      major: user.metadata.major._id,
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
        select: 'name metadata.major username',
        populate: {
          path: 'metadata.major',
          model: 'Major',
          populate: {
            path: 'school',
            model: 'School',
          },
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
      .map((sc) => ({
        ...sc,
        totalStep: (sc.steps || []).reduce((sum, s) => sum + (s.step || 0), 0),
      }))
      .sort((a, b) => b.totalStep - a.totalStep);

    // Assign computed rank
    const combinedWithRank = completed.map((sc, idx) => ({
      ...sc,
      computedRank: idx + 1,
    }));

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
    };
  }

  async getUserRankSummary(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('_id metadata.major')
      .lean()
      .then((u) => {
        if (!u) throw new NotFoundException('User not found');
        return u;
      });

    const allStepCounters = await this.stepCounterModel
      .find()
      .populate({
        path: 'user',
        select: 'name username _id',
      })
      .lean();

    /* Find User's Total Step */
    const myStepCounter = allStepCounters.find(
      (sc) => sc.user._id.toString() === user._id.toString(),
    );
    if (!myStepCounter) throw new NotFoundException('Step counter not found');

    const myTotalSteps = myStepCounter.steps?.at(-1)?.totalStep || 0;

    /* For Individual Rank */
    const globalRanked = allStepCounters
      .map((sc) => ({
        user: sc.user,
        totalStep: sc.steps?.at(-1)?.totalStep || 0,
      }))
      .sort((a, b) => b.totalStep - a.totalStep);
    const computedRank =
      globalRanked.findIndex(
        (r) => r.user._id.toString() === user._id.toString(),
      ) + 1;
    const archeivementRank = allStepCounters.filter(
      (sc) =>
        sc.achievement &&
        sc.completeStatus &&
        sc.rank &&
        sc.rank > 0 &&
        sc.achievement.toString() === myStepCounter.achievement?.toString(),
    );
    let schoolRank: number | null = null;
    let schoolId: string | null = null;
    let schoolSorted: { user: Types.ObjectId; totalStep: number }[] = [];

    if (user.metadata && user.metadata.major) {
      const major = await this.majorModel
        .findById(user.metadata.major)
        .select('_id school')
        .lean();

      if (major && major.school) {
        schoolId = major.school.toString();

        /*
        Find Matched School Rank From User
        */
        const schoolRanked = globalRanked.filter((sc) => {
          const match = allStepCounters.find(
            (full) => full.user._id.toString() === sc.user._id.toString(),
          );
          return match?.school?.toString() === schoolId;
        });

        schoolSorted = schoolRanked.sort((a, b) => b.totalStep - a.totalStep);

        schoolRank =
          schoolSorted.findIndex(
            (r) => r.user._id.toString() === user._id.toString(),
          ) + 1;
      }
    }
    return {
      individualRank: globalRanked.slice(0, 20),
      schoolRank: schoolSorted.slice(0, 20),
      archeivementRank: archeivementRank.slice(0, 20),
      myRank: {
        steps: myStepCounter.steps,
        individualRank: computedRank,
        schoolRank: schoolRank,
        archeivementRank: myStepCounter.rank || null,
        totalSteps: myTotalSteps,
      },
    };
  }
}
