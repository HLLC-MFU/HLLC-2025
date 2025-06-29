import { Injectable } from '@nestjs/common';
import { CreateStepCounterDto } from './dto/create-step-counter.dto';
import { InjectModel } from '@nestjs/mongoose';
import { StepCounter, StepCounterDocument } from './schema/step-counter.schema';
import { Model, Types } from 'mongoose';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
} from 'src/pkg/helper/query.util';
import { StepAchievement, StepAchievementDocument, } from '../step-achievement/schema/step-achievement.schema';
@Injectable()
export class StepCountersService {
  constructor(
    @InjectModel(StepCounter.name)
    private stepCounterModel: Model<StepCounterDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(StepAchievement.name)
    private stepAchievementModel: Model<StepAchievementDocument>
  ) { }

  async create(createStepCounterDto: CreateStepCounterDto) {
    await findOrThrow(this.userModel, createStepCounterDto.user, 'User not found');

    const { user, steps: incomingSteps = [] } = createStepCounterDto;

    const achievements = await this.stepCounterModel.db
      .collection('step-achievement')
      .find({})
      .sort({ _id: 1 })
      .toArray();

    const primaryAchievement = achievements[0];
    if (!primaryAchievement) {
      throw new Error('No available achievement found');
    }

    const achievement = primaryAchievement._id;

    let existing = await this.stepCounterModel.findOne({ user, achievement });

    const achievementTarget = (primaryAchievement as any)?.achievement;

    if (!existing) {
      let total = 0;
      const stepData = incomingSteps.map(s => {
        const stepDate = s.date ? new Date(s.date) : new Date();
        const dateOnly = new Date(stepDate.getFullYear(), stepDate.getMonth(), stepDate.getDate());
        total += s.step;
        return {
          step: s.step,
          date: dateOnly,
          totalStep: total,
        };
      });

      const newStepCounter = new this.stepCounterModel({
        user,
        achievement,
        steps: stepData,
        completeStatus: achievementTarget && total >= achievementTarget,
      });

      return await newStepCounter.save();
    }


    // merge
    for (const incoming of incomingSteps) {
      const stepDate = incoming.date ? new Date(incoming.date) : new Date();
      const dateOnly = new Date(stepDate.getFullYear(), stepDate.getMonth(), stepDate.getDate());

      const existingStep = existing.steps.find(s =>
        new Date(s.date).toDateString() === dateOnly.toDateString()
      );

      if (existingStep) {
        existingStep.step += incoming.step;
      } else {
        existing.steps.push({
          step: incoming.step,
          date: dateOnly,
          totalStep: 0,
        });
      }
    }

    existing.steps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let total = 0;
    for (const s of existing.steps) {
      total += s.step;
      s.totalStep = total;
    }

    if (typeof achievementTarget === 'number' && total >= achievementTarget) {
      existing.completeStatus = true;
    }

    return await existing.save();
  }

  async findAll(query: Record<string, string>) {
    return await queryAll<StepCounter>({
      model: this.stepCounterModel,
      query,
      filterSchema: {},
      populateFields: () =>
        Promise.resolve([
          {
            path: 'user',
            populate: {
              path: 'metadata.major',
              model: 'Major',
              populate: { path: 'school' },
            },
          },
          {
            path: 'achievement'
          }
        ]),
    });
  }

  async findOne(id: string) {
    return await queryFindOne<StepCounter>(
      this.stepCounterModel,
      { _id: id },
      [
        {
          path: 'user',
          populate: {
            path: 'metadata.major',
            model: 'Major',
            populate: {
              path: 'school',
              model: 'School',
            },
          },
        },
        {
          path: 'achievement',
        }
      ]
    );
  }

  async remove(id: string) {
    await queryDeleteOne<StepCounter>(this.stepCounterModel, id);
    return {
      message: 'Step counter deleted successfully',
      id,
    };
  }

  // all leaderboard user for top 3
  async getLeaderboard(limit = 3) {
    const stepCounters = await this.stepCounterModel.find({})
      .populate({
        path: 'user',
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

    const withTotalSteps = stepCounters.map(sc => {
      const total = sc.steps?.reduce((sum, s) => sum + s.step, 0) || 0;
      return {
        ...sc,
        totalStep: total,
      };
    });

    const top = withTotalSteps
      .sort((a, b) => b.totalStep - a.totalStep)
      .slice(0, limit);

    return {
      data: top,
      metadata: {
        total: top.length,
        limit,
      },
      message: `Top ${limit} users with highest total step fetched successfully`,
    };
  }

  // for query all leaderboard by date
  async getDailyLeaderboard(date: string | Date) {
    const dateOnly = new Date(new Date(date).toDateString());
    const targetDateStr = dateOnly.toISOString().split('T')[0];

    const stepCounters = await this.stepCounterModel.find({})
      .populate({
        path: 'user',
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

    const leaderboard = stepCounters.map((sc) => {
      const stepsOnThatDate = (sc.steps || []).filter((s) => {
        const sDate = new Date(s.date).toISOString().split('T')[0];
        return sDate === targetDateStr;
      });

      const totalStep = stepsOnThatDate.reduce((sum, s) => sum + Number(s.step || 0), 0);

      return {
        ...sc,
        totalStep,
      };
    });

    const sorted = leaderboard
      .filter((entry) => entry.totalStep > 0)
      .sort((a, b) => b.totalStep - a.totalStep)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return {
      data: sorted,
      metadata: {
        date: targetDateStr,
        total: sorted.length,
      },
      message: `Top ${sorted.length} users with highest steps on ${dateOnly.toDateString()}`,
    };
  }

  // leaderboard find all user by school
  async getLeaderboardBySchoolId(schoolId: string) {
    const stepCounters = await this.stepCounterModel.find({})
      .populate({
        path: 'user',
        model: 'User',
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

    const withTotalSteps = stepCounters.map((sc) => {
      const totalStep = (sc.steps || []).reduce((sum, s) => sum + (s.step || 0), 0);
      return { ...sc, totalStep };
    });

    const filtered = withTotalSteps.filter((sc) => {
      const user = sc.user as any;
      const school = user?.metadata?.major?.school;
      return school && school._id?.toString() === schoolId;
    });

    const top = filtered
      .sort((a, b) => b.totalStep - a.totalStep)
      .slice(0, 5)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return {
      data: top,
      metadata: {
        total: top.length,
      },
      message: `Top ${top.length} users in school ${schoolId}`,
    };
  }

  // leaderboard school query by date again
  async getLeaderboardBySchoolAndDate(schoolId: string, date: Date) {
    const dateOnly = new Date(date.toDateString());
    const startOfDay = new Date(dateOnly.setHours(0, 0, 0, 0));
    const endOfDay = new Date(dateOnly.setHours(23, 59, 59, 999));

    const stepCounters = await this.stepCounterModel.find({
      steps: {
        $elemMatch: {
          date: { $gte: startOfDay, $lte: endOfDay },
        },
      },
    })
      .populate({
        path: 'user',
        model: 'User',
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

    const leaderboard = stepCounters
      .map(sc => {
        const stepsToday = (sc.steps || []).filter(s =>
          new Date(s.date).toDateString() === date.toDateString()
        );
        const totalStep = stepsToday.reduce((sum, s) => sum + (s.step || 0), 0);
        return { ...sc, totalStep };
      })
      .filter(sc => {
        const school = (sc.user as any)?.metadata?.major?.school;
        return school && school._id?.toString() === schoolId && sc.totalStep > 0;
      })
      .sort((a, b) => b.totalStep - a.totalStep)
      .slice(0, 5)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return {
      data: leaderboard,
      metadata: {
        total: leaderboard.length,
        date: date.toDateString(),
        schoolId,
      },
      message: `Top ${leaderboard.length} users in school ${schoolId} on ${date.toDateString()}`,
    };
  }

  async getLeaderBoardByAchieved(stepAchievementId?: string) {
    const achievement = stepAchievementId
      ? await this.stepAchievementModel.findById(stepAchievementId).lean()
      : await this.stepAchievementModel.findOne({}).sort({ createdAt: 1 }).lean();

    if (!achievement) {
      throw new Error('No achievement found');
    }

    const stepCounters = await this.stepCounterModel.find({
      achievement: achievement._id,
    })
      .populate([
        {
          path: 'user',
          populate: {
            path: 'metadata.major',
            model: 'Major',
            populate: {
              path: 'school',
              model: 'School',
            },
          },
        },
        {
          path: 'achievement',
        },
      ])
      .lean();

    const withAchievedDate = stepCounters.map((sc) => {
      const reached = (sc.steps || []).find(s => s.totalStep >= achievement.achievement);
      const achievedDate = reached?.date ?? null;

      const updatedAt = (sc as any).updatedAt;

      return {
        ...sc,
        achievedDate,
        hasAchieved: !!achievedDate,
        totalStep: (sc.steps || []).reduce((sum, s) => sum + (s.step || 0), 0),
        updatedAt,
      };
    });

    const ranked = withAchievedDate
      .sort((a, b) => {
        if (a.hasAchieved && !b.hasAchieved) return -1;
        if (!a.hasAchieved && b.hasAchieved) return 1;

        const aDate = a.achievedDate ?? a.updatedAt ?? new Date();
        const bDate = b.achievedDate ?? b.updatedAt ?? new Date();

        return new Date(aDate).getTime() - new Date(bDate).getTime();
      })
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return {
      data: ranked,
      metadata: {
        total: ranked.length,
        achievementId: achievement._id,
      },
      message: `Users ranked by achievement target ${achievement.achievement}`,
    };
  }

  async getUserRank(userId: string, scope: 'global' | 'school' | 'achieved', stepAchievementId?: string) {
    const target = await this.stepCounterModel.findOne({ user: userId })
      .populate({
        path: 'user',
        populate: {
          path: 'metadata.major',
          model: 'Major',
          populate: { path: 'school', model: 'School' },
        },
      })
      .populate('achievement')
      .lean();

    if (!target) throw new Error('User not found');

    const targetTotalStep = (target.steps || []).reduce((sum, s) => sum + s.step, 0);

    let all: any[] = [];

    if (scope === 'global') {
      all = await this.stepCounterModel.find({})
        .populate({
          path: 'user',
          populate: {
            path: 'metadata.major',
            model: 'Major',
            populate: { path: 'school', model: 'School' },
          },
        })
        .lean();

      all = all.map(sc => ({
        ...sc,
        totalStep: (sc.steps || []).reduce((sum, s) => sum + s.step, 0),
      }));

      all.sort((a, b) => b.totalStep - a.totalStep);

    } else if (scope === 'school') {
      const schoolId = (target.user as any)?.metadata?.major?.school?._id?.toString();
      if (!schoolId) throw new Error('User has no school');

      all = await this.stepCounterModel.find({})
        .populate({
          path: 'user',
          populate: {
            path: 'metadata.major',
            model: 'Major',
            populate: { path: 'school', model: 'School' },
          },
        })
        .lean();

      all = all.filter((sc) => {
        const school = (sc.user as any)?.metadata?.major?.school;
        return school && school._id?.toString() === schoolId;
      });

      all = all.map(sc => ({
        ...sc,
        totalStep: (sc.steps || []).reduce((sum, s) => sum + s.step, 0),
      }));

      all.sort((a, b) => b.totalStep - a.totalStep);

    } else if (scope === 'achieved') {
      if (!stepAchievementId) {
        throw new Error('stepAchievementId is required for achieved scope');
      }

      const achievement = await this.stepAchievementModel.findById(stepAchievementId).lean();
      if (!achievement) throw new Error('Achievement not found');

      const achievementGoal = achievement.achievement;

      const achievementObjId = new Types.ObjectId(stepAchievementId);

      all = await this.stepCounterModel.find({
        achievement: achievementObjId,
      })
        .populate({
          path: 'user',
          populate: {
            path: 'metadata.major',
            model: 'Major',
            populate: { path: 'school', model: 'School' },
          },
        })
        .lean();

      all = all.map(sc => {
        const achievedStep = (sc.steps || []).find(s => s.totalStep >= achievementGoal);
        return {
          ...sc,
          hasAchieved: !!achievedStep,
          completionDate: achievedStep ? new Date(achievedStep.date) : new Date(sc.updatedAt),
          totalStep: (sc.steps || []).reduce((sum, s) => sum + s.step, 0),
        };
      });

      all.sort((a, b) => {
        if (a.hasAchieved && !b.hasAchieved) return -1;
        if (!a.hasAchieved && b.hasAchieved) return 1;
        return a.completionDate.getTime() - b.completionDate.getTime();
      });
    }

    // find raking
    const rank = all.findIndex(sc => {
      const id = typeof sc.user === 'object' ? sc.user._id?.toString() : sc.user?.toString();
      return id === userId;
    }) + 1;

    return {
      rank,
      total: all.length,
      stepCount: targetTotalStep,
      username: (target.user as any)?.username ?? null,
      name: (target.user as any)?.name,
      message: rank > 0 ? 'User rank found' : 'User not found in ranking',
    };
  }

}
