import { Injectable } from '@nestjs/common';
import { CreateStepCounterDto } from './dto/create-step-counter.dto';
import { InjectModel } from '@nestjs/mongoose';
import { StepCounter, StepCounterDocument } from './schema/step-counter.schema';
import { Model } from 'mongoose';
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

    const { user, step: incomingSteps } = createStepCounterDto;

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
        step: stepData,
        completeStatus: achievementTarget && total >= achievementTarget,
      });

      return await newStepCounter.save();
    }

    // merge
    for (const incoming of incomingSteps) {
      const stepDate = incoming.date ? new Date(incoming.date) : new Date();
      const dateOnly = new Date(stepDate.getFullYear(), stepDate.getMonth(), stepDate.getDate());

      const existingStep = existing.step.find(s =>
        new Date(s.date).toDateString() === dateOnly.toDateString()
      );

      if (existingStep) {
        existingStep.step += incoming.step;
      } else {
        existing.step.push({
          step: incoming.step,
          date: dateOnly,
          totalStep: 0,
        });
      }
    }

    existing.step.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let total = 0;
    for (const s of existing.step) {
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
  async getLeaderboard() {
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
      const total = sc.step?.reduce((sum, s) => sum + s.step, 0) || 0;
      return {
        ...sc,
        totalStep: total,
      };
    });
    const top = withTotalSteps
      .sort((a, b) => b.totalStep - a.totalStep)
      .slice(0, 3);

    return {
      data: top,
      metadata: {
        total: top.length,
      },
      message: 'Top 3 users with highest total step fetched successfully',
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
      const stepsOnThatDate = (sc.step || []).filter((s) => {
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
      const totalStep = (sc.step || []).reduce((sum, s) => sum + (s.step || 0), 0);
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
      step: {
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
        const stepsToday = (sc.step || []).filter(s =>
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

  // leaderboard for achievements pass
  async getLeaderBoardByAchieved() {
    const achievements = await this.stepCounterModel.db
      .collection('step-achievement')
      .find({})
      .sort({ createdAt: 1 })
      .toArray();

    const primaryAchievement = achievements[0];
    if (!primaryAchievement) {
      throw new Error('No achievement defined');
    }

    const completed = await this.stepCounterModel.find({
      completeStatus: true,
      achievement: primaryAchievement._id,
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

    const completedWithAchievedDate = completed.map((entry) => {
      const reached = (entry.step || []).find((s) => s.totalStep >= primaryAchievement.achievement);
      const achievedDate = reached?.date ?? null;
      return {
        ...entry,
        achievedDate,
      };
    });

    const filtered = completedWithAchievedDate.filter((entry) => entry.achievedDate);
    filtered.sort((a, b) => new Date(a.achievedDate!).getTime() - new Date(b.achievedDate!).getTime());

    const ranked = filtered.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    return {
      data: ranked,
      metadata: {
        total: ranked.length,
      },
      message: 'Users who completed the primary achievement sorted by earliest success',
    };
  }

  async getUserRank(userId: string, scope: 'global' | 'school' | 'achieved') {
    // หา target user พร้อม populate
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

    // คำนวณ total step ของ target
    const targetTotalStep = (target.step || []).reduce((sum, s) => sum + s.step, 0);

    let all: any[] = [];

    if (scope === 'global') {
      // โหลดทุก user
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

      // คำนวณ totalStep
      all = all.map(sc => ({
        ...sc,
        totalStep: (sc.step || []).reduce((sum, s) => sum + s.step, 0),
      }));

      // เรียงตาม totalStep ลดหลั่น
      all.sort((a, b) => b.totalStep - a.totalStep);

    } else if (scope === 'school') {
      // หา schoolId ของ target
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

      // กรองเฉพาะ school เดียวกัน
      all = all.filter((sc) => {
        const school = (sc.user as any)?.metadata?.major?.school;
        return school && school._id?.toString() === schoolId;
      });

      // คำนวณ totalStep
      all = all.map(sc => ({
        ...sc,
        totalStep: (sc.step || []).reduce((sum, s) => sum + s.step, 0),
      }));

      // เรียงตาม totalStep ลดหลั่น
      all.sort((a, b) => b.totalStep - a.totalStep);

    } else if (scope === 'achieved') {
      // โหลด achievement ทั้งหมด (เรียง _id asc)
      const achievements = await this.stepCounterModel.db
        .collection('step-achievement')
        .find({})
        .sort({ _id: 1 })
        .toArray();

      const primaryAchievement = achievements[0]?._id;
      const achievementGoal = achievements[0]?.achievement;
      if (!primaryAchievement) throw new Error('No primary achievement found');

      // หา users ที่สำเร็จ primary achievement
      all = await this.stepCounterModel.find({
        achievement: primaryAchievement,
        completeStatus: true,
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

      // หาวันที่สำเร็จจริงของแต่ละ user จาก step ที่ totalStep >= เป้าหมาย
      all = all.map(sc => {
        const achievedStep = (sc.step || []).find(s => s.totalStep >= achievementGoal);
        return {
          ...sc,
          completionDate: achievedStep ? new Date(achievedStep.date) : new Date(sc.updatedAt),
          totalStep: (sc.step || []).reduce((sum, s) => sum + s.step, 0),
        };
      });

      // เรียงตามวันที่สำเร็จเร็วที่สุดก่อน
      all.sort((a, b) => a.completionDate.getTime() - b.completionDate.getTime());
    }

    // หาอันดับ
    const rank = all.findIndex(sc =>
      sc.user?._id?.toString() === userId || sc.user?.toString() === userId
    ) + 1;

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
