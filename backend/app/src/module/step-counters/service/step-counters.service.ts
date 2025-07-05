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
}

// async create(createStepCounterDto: CreateStepCounterDto) {
//   await findOrThrow(
//     this.userModel,
//     createStepCounterDto.user,
//     'User not found',
//   );

//   const { user, steps: incomingSteps = [] } = createStepCounterDto;

//   const achievements = await this.stepCounterModel.db
//     .collection('step-achievement')
//     .find({})
//     .sort({ _id: 1 })
//     .toArray();

//   const primaryAchievement = achievements[0];
//   if (!primaryAchievement) {
//     throw new NotFoundException('No available achievement found');
//   }

//   const achievement = primaryAchievement._id;

//   const existing = await this.stepCounterModel.findOne({
//     user: new Types.ObjectId(user),
//     achievement,
//   });

//   const achievementTarget = (primaryAchievement as any)?.achievement;

//   if (!existing) {
//     let total = 0;
//     const stepData = incomingSteps.map((s) => {
//       const stepDate = s.date ? new Date(s.date) : new Date();
//       const dateOnly = new Date(
//         stepDate.getFullYear(),
//         stepDate.getMonth(),
//         stepDate.getDate(),
//       );
//       total += s.step;
//       return {
//         step: s.step,
//         date: dateOnly,
//         totalStep: total,
//       };
//     });

//     const newStepCounter = new this.stepCounterModel({
//       user: new Types.ObjectId(user),
//       achievement,
//       steps: stepData,
//       completeStatus: achievementTarget && total >= achievementTarget,
//     });

//     return await newStepCounter.save();
//   }

//   // merge
//   for (const incoming of incomingSteps) {
//     const stepDate = incoming.date ? new Date(incoming.date) : new Date();
//     const dateOnly = new Date(
//       stepDate.getFullYear(),
//       stepDate.getMonth(),
//       stepDate.getDate(),
//     );

//     const existingStep = existing.steps.find(
//       (s) => new Date(s.date).toDateString() === dateOnly.toDateString(),
//     );

//     if (existingStep) {
//       existingStep.step += incoming.step;
//     } else {
//       existing.steps.push({
//         step: incoming.step,
//         date: dateOnly,
//         totalStep: 0,
//       });
//     }
//   }

//   existing.steps.sort(
//     (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
//   );

//   let total = 0;
//   for (const s of existing.steps) {
//     total += s.step;
//     s.totalStep = total;
//   }

//   if (typeof achievementTarget === 'number' && total >= achievementTarget) {
//     existing.completeStatus = true;
//   }

//   return await existing.save();
// }

// async findAll(query: Record<string, string>) {
//   return await queryAll<StepCounter>({
//     model: this.stepCounterModel,
//     query,
//     filterSchema: {},
//     populateFields: () =>
//       Promise.resolve([
//         {
//           path: 'user',
//           populate: {
//             path: 'metadata.major',
//             model: 'Major',
//             populate: { path: 'school' },
//           },
//         },
//         {
//           path: 'achievement',
//         },
//       ]),
//   });
// }

// async findOne(id: string) {
//   return await queryFindOne<StepCounter>(this.stepCounterModel, { _id: id }, [
//     {
//       path: 'user',
//       populate: {
//         path: 'metadata.major',
//         model: 'Major',
//         populate: {
//           path: 'school',
//           model: 'School',
//         },
//       },
//     },
//     {
//       path: 'achievement',
//     },
//   ]);
// }

// async remove(id: string) {
//   await queryDeleteOne<StepCounter>(this.stepCounterModel, id);
//   return {
//     message: 'Step counter deleted successfully',
//     id,
//   };
// }

// // all leaderboard user for top 3
// async getLeaderboard(limit = 3) {
//   const stepCounters = await this.stepCounterModel
//     .find({})
//     .populate({
//       path: 'user',
//       populate: {
//         path: 'metadata.major',
//         model: 'Major',
//         populate: {
//           path: 'school',
//           model: 'School',
//         },
//       },
//     })
//     .lean();

//   const withTotalSteps = stepCounters.map((sc) => {
//     const total = sc.steps?.reduce((sum, s) => sum + s.step, 0) || 0;
//     return {
//       ...sc,
//       totalStep: total,
//     };
//   });

//   const top = withTotalSteps
//     .sort((a, b) => b.totalStep - a.totalStep)
//     .slice(0, limit);

//   return {
//     data: top,
//     metadata: {
//       total: top.length,
//       limit,
//     },
//     message: `Top ${limit} users with highest total step fetched successfully`,
//   };
// }

// // for query all leaderboard by date
// async getDailyLeaderboard(date: string | Date) {
//   const dateOnly = new Date(new Date(date).toDateString());
//   const targetDateStr = dateOnly.toISOString().split('T')[0];

//   const stepCounters = await this.stepCounterModel
//     .find({})
//     .populate({
//       path: 'user',
//       populate: {
//         path: 'metadata.major',
//         model: 'Major',
//         populate: {
//           path: 'school',
//           model: 'School',
//         },
//       },
//     })
//     .lean();

//   const leaderboard = stepCounters.map((sc) => {
//     const stepsOnThatDate = (sc.steps || []).filter((s) => {
//       const sDate = new Date(s.date).toISOString().split('T')[0];
//       return sDate === targetDateStr;
//     });

//     const totalStep = stepsOnThatDate.reduce(
//       (sum, s) => sum + Number(s.step || 0),
//       0,
//     );

//     return {
//       ...sc,
//       totalStep,
//     };
//   });

//   const sorted = leaderboard
//     .filter((entry) => entry.totalStep > 0)
//     .sort((a, b) => b.totalStep - a.totalStep)
//     .map((entry, index) => ({
//       rank: index + 1,
//       ...entry,
//     }));

//   return {
//     data: sorted,
//     metadata: {
//       date: targetDateStr,
//       total: sorted.length,
//     },
//     message: `Top ${sorted.length} users with highest steps on ${dateOnly.toDateString()}`,
//   };
// }

// // leaderboard find all user by school
// async getLeaderboardBySchoolId(schoolId: string) {
//   const stepCounters = await this.stepCounterModel
//     .find({})
//     .populate({
//       path: 'user',
//       model: 'User',
//       populate: {
//         path: 'metadata.major',
//         model: 'Major',
//         populate: {
//           path: 'school',
//           model: 'School',
//         },
//       },
//     })
//     .lean();

//   const withTotalSteps = stepCounters.map((sc) => {
//     const totalStep = (sc.steps || []).reduce(
//       (sum, s) => sum + (s.step || 0),
//       0,
//     );
//     return { ...sc, totalStep };
//   });

//   const filtered = withTotalSteps.filter((sc) => {
//     const user = sc.user as any;
//     const school = user?.metadata?.major?.school;
//     return school && school._id?.toString() === schoolId;
//   });

//   const top = filtered
//     .sort((a, b) => b.totalStep - a.totalStep)
//     .slice(0, 5)
//     .map((entry, index) => ({
//       rank: index + 1,
//       ...entry,
//     }));

//   return {
//     data: top,
//     metadata: {
//       total: top.length,
//     },
//     message: `Top ${top.length} users in school ${schoolId}`,
//   };
// }

// // leaderboard school query by date again
// async getLeaderboardBySchoolAndDate(schoolId: string, date: Date) {
//   const dateOnly = new Date(date.toDateString());
//   const startOfDay = new Date(dateOnly.setHours(0, 0, 0, 0));
//   const endOfDay = new Date(dateOnly.setHours(23, 59, 59, 999));

//   const stepCounters = await this.stepCounterModel
//     .find({
//       steps: {
//         $elemMatch: {
//           date: { $gte: startOfDay, $lte: endOfDay },
//         },
//       },
//     })
//     .populate({
//       path: 'user',
//       model: 'User',
//       populate: {
//         path: 'metadata.major',
//         model: 'Major',
//         populate: {
//           path: 'school',
//           model: 'School',
//         },
//       },
//     })
//     .lean();

//   const leaderboard = stepCounters
//     .map((sc) => {
//       const stepsToday = (sc.steps || []).filter(
//         (s) => new Date(s.date).toDateString() === date.toDateString(),
//       );
//       const totalStep = stepsToday.reduce((sum, s) => sum + (s.step || 0), 0);
//       return { ...sc, totalStep };
//     })
//     .filter((sc) => {
//       const school = (sc.user as any)?.metadata?.major?.school;
//       return (
//         school && school._id?.toString() === schoolId && sc.totalStep > 0
//       );
//     })
//     .sort((a, b) => b.totalStep - a.totalStep)
//     .slice(0, 5)
//     .map((entry, index) => ({
//       rank: index + 1,
//       ...entry,
//     }));

//   return {
//     data: leaderboard,
//     metadata: {
//       total: leaderboard.length,
//       date: date.toDateString(),
//       schoolId,
//     },
//     message: `Top ${leaderboard.length} users in school ${schoolId} on ${date.toDateString()}`,
//   };
// }

// private getAchievedSortedList(stepCounters: any[], achievementGoal: number) {
//   return stepCounters
//     .map((sc) => {
//       const achievedStep = (sc.steps || []).find(
//         (s) => s.totalStep >= achievementGoal,
//       );
//       return {
//         ...sc,
//         hasAchieved: !!achievedStep,
//         completionDate: achievedStep
//           ? new Date(achievedStep.date)
//           : new Date(sc.updatedAt),
//         totalStep: (sc.steps || []).reduce(
//           (sum, s) => sum + (s.step || 0),
//           0,
//         ),
//       };
//     })
//     .sort((a, b) => {
//       if (a.hasAchieved && !b.hasAchieved) return -1;
//       if (!a.hasAchieved && b.hasAchieved) return 1;
//       if (a.hasAchieved && b.hasAchieved) {
//         return a.completionDate.getTime() - b.completionDate.getTime();
//       }
//       return b.totalStep - a.totalStep;
//     });
// }

// async getLeaderBoardByAchieved(stepAchievementId?: string) {
//   const achievement = stepAchievementId
//     ? await this.stepAchievementModel.findById(stepAchievementId).lean()
//     : await this.stepAchievementModel
//         .findOne({})
//         .sort({ createdAt: 1 })
//         .lean();

//   if (!achievement) {
//     throw new NotFoundException('No achievement found');
//   }

//   const stepCounters = await this.stepCounterModel
//     .find({
//       achievement: achievement._id,
//     })
//     .populate([
//       {
//         path: 'user',
//         populate: {
//           path: 'metadata.major',
//           model: 'Major',
//           populate: {
//             path: 'school',
//             model: 'School',
//           },
//         },
//       },
//       {
//         path: 'achievement',
//       },
//     ])
//     .lean();

//   const ranked = this.getAchievedSortedList(
//     stepCounters,
//     achievement.achievement,
//   ).map((entry, index) => ({
//     rank: index + 1,
//     ...entry,
//   }));

//   return {
//     data: ranked,
//     metadata: {
//       total: ranked.length,
//       achievementId: achievement._id,
//     },
//     message: `Users ranked by achievement target ${achievement.achievement}`,
//   };
// }

// async getUserRank(
//   userId: string,
//   scope: 'global' | 'school' | 'achieved',
//   stepAchievementId?: string,
// ) {
//   const target = await this.stepCounterModel
//     .findOne({ user: userId })
//     .populate({
//       path: 'user',
//       populate: {
//         path: 'metadata.major',
//         model: 'Major',
//         populate: { path: 'school', model: 'School' },
//       },
//     })
//     .populate('achievement')
//     .lean();

//   if (!target) throw new NotFoundException('User not found');

//   const targetTotalStep = (target.steps || []).reduce(
//     (sum, s) => sum + s.step,
//     0,
//   );

//   let all: any[] = [];

//   if (scope === 'global') {
//     all = await this.stepCounterModel
//       .find({})
//       .populate({
//         path: 'user',
//         populate: {
//           path: 'metadata.major',
//           model: 'Major',
//           populate: { path: 'school', model: 'School' },
//         },
//       })
//       .lean();

//     all = all.map((sc) => ({
//       ...sc,
//       totalStep: (sc.steps || []).reduce((sum, s) => sum + s.step, 0),
//     }));

//     all.sort((a, b) => b.totalStep - a.totalStep);
//   } else if (scope === 'school') {
//     const schoolId = (
//       target.user as any
//     )?.metadata?.major?.school?._id?.toString();
//     if (!schoolId) throw new NotFoundException('User has no school');

//     all = await this.stepCounterModel
//       .find({})
//       .populate({
//         path: 'user',
//         populate: {
//           path: 'metadata.major',
//           model: 'Major',
//           populate: { path: 'school', model: 'School' },
//         },
//       })
//       .lean();

//     all = all.filter((sc) => {
//       const school = sc.user?.metadata?.major?.school;
//       return school && school._id?.toString() === schoolId;
//     });

//     all = all.map((sc) => ({
//       ...sc,
//       totalStep: (sc.steps || []).reduce((sum, s) => sum + s.step, 0),
//     }));

//     all.sort((a, b) => b.totalStep - a.totalStep);
//   } else if (scope === 'achieved') {
//     if (!stepAchievementId) {
//       throw new BadRequestException(
//         'stepAchievementId is required for achieved scope',
//       );
//     }

//     const achievement = await this.stepAchievementModel
//       .findById(stepAchievementId)
//       .lean();
//     if (!achievement) throw new NotFoundException('Achievement not found');

//     const achievementGoal = achievement.achievement;
//     const achievementObjId = new Types.ObjectId(stepAchievementId);

//     all = await this.stepCounterModel
//       .find({
//         achievement: achievementObjId,
//       })
//       .populate({
//         path: 'user',
//         populate: {
//           path: 'metadata.major',
//           model: 'Major',
//           populate: { path: 'school', model: 'School' },
//         },
//       })
//       .lean();

//     all = this.getAchievedSortedList(all, achievementGoal);
//   }

//   // find ranking
//   const rank =
//     all.findIndex((sc) => {
//       const id =
//         typeof sc.user === 'object'
//           ? sc.user._id?.toString()
//           : sc.user?.toString();
//       return id === userId.toString();
//     }) + 1;

//   return {
//     rank,
//     total: all.length,
//     stepCount: targetTotalStep,
//     username: (target.user as any)?.username ?? null,
//     name: (target.user as any)?.name,
//     message: rank > 0 ? 'User rank found' : 'User not found in ranking',
//   };
// }
