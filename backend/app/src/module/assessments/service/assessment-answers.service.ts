import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAssessmentAnswerDto } from '../dto/assessment-answers/create-assessment-answer.dto';
import {
  AssessmentAnswer,
  AssessmentAnswerDocument,
} from '../schema/assessment-answer.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOneByFilter,
} from 'src/pkg/helper/query.util';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Assessment, AssessmentDocument } from '../schema/assessment.schema';
import { SseService } from 'src/module/sse/sse.service';
@Injectable()
export class AssessmentAnswersService {
  constructor(
    @InjectModel(AssessmentAnswer.name)
    private assessmentAnswerModel: Model<AssessmentAnswerDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(Assessment.name)
    private assessmentModel: Model<AssessmentDocument>,

    private readonly sseService: SseService,
  ) {}

  async create(createAssessmentAnswerDto: CreateAssessmentAnswerDto) {
    const { user, answers } = createAssessmentAnswerDto;
    const userId = new Types.ObjectId(user);

    // Fetch assessment answers and verify user in a single call if possible
    const existingDoc = await this.assessmentAnswerModel
      .findOne({ user: userId })
      .select('answers.assessment')
      .lean();

    // Only check user existence if there's no answer document
    if (!existingDoc) {
      const userExists = await this.userModel.exists({ _id: userId });
      if (!userExists) throw new NotFoundException('User not found');
    }

    // Build a Set of existing assessments (string ids)
    const existingSet = new Set(
      existingDoc?.answers.map((a) => a.assessment.toString()) ?? [],
    );

    // Filter new answers not yet stored
    const filteredNewAnswers: { assessment: Types.ObjectId; answer: string }[] =
      [];
    for (const a of answers) {
      if (!existingSet.has(a.assessment)) {
        filteredNewAnswers.push({
          assessment: new Types.ObjectId(a.assessment),
          answer: a.answer,
        });
      }
    }

    if (!filteredNewAnswers.length) {
      throw new BadRequestException(
        'Assessment answers already exist for this user',
      );
    }

    // Perform DB update
    const result = await queryUpdateOneByFilter<AssessmentAnswer>(
      this.assessmentAnswerModel,
      { user: userId },
      {
        $addToSet: {
          answers: { $each: filteredNewAnswers },
        },
      },
      { upsert: true },
    );

    const eventPayload = {
      type: 'REFETCH_DATA',
      path: '/activities/progress',
    };

    console.log(
      '[SSE] sending event payload:',
      userId.toString(),
      eventPayload,
    );

    this.sseService.sendToUser(userId.toString(), {
      type: 'REFETCH_DATA',
      path: '/activities/progress',
    });

    return result;
  }

  async findAll(query: Record<string, string>) {
    return queryAll<AssessmentAnswer>({
      model: this.assessmentAnswerModel,
      query,
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'user' }]),
    });
  }

  async findOne(
    id: string,
  ): Promise<{ data: AssessmentAnswer[] | null; message: string }> {
    const result = await queryFindOne<AssessmentAnswer>(
      this.assessmentAnswerModel,
      { _id: id },
      [{ path: 'user' }],
    );
    return result;
  }

  async remove(id: string) {
    await queryDeleteOne<AssessmentAnswer>(this.assessmentAnswerModel, id);
    return {
      message: 'Assessment answer deleted successfully',
      id,
    };
  }

  async averageAllAssessments(): Promise<
    { assessment: Assessment; average: number; count: number }[]
  > {
    const results = await queryAll<AssessmentAnswer>({
      model: this.assessmentAnswerModel,
      query: {},
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'answers.assessment' }]),
    });

    const scoreMap = new Map<Assessment, { sum: number; count: number }>();

    for (const result of results.data) {
      for (const answer of result.answers) {
        const assessmentRaw = answer.assessment;

        if (typeof assessmentRaw === 'object' && '_id' in assessmentRaw) {
          const assessment = assessmentRaw as any as Assessment;

          const numericAnswer = parseFloat(answer.answer);
          if (!isNaN(numericAnswer)) {
            if (!scoreMap.has(assessment)) {
              scoreMap.set(assessment, { sum: 0, count: 0 });
            }
            const current = scoreMap.get(assessment)!;
            current.sum += numericAnswer;
            current.count += 1;
          }
        } else {
          throw new Error('Assessment not populated');
        }
      }
    }

    const output = Array.from(scoreMap.entries()).map(
      ([assessment, { sum, count }]) => ({
        assessment,
        average: sum / count,
        count,
      }),
    );

    return output;
  }

  async averageAssessmentsByActivity(
    activityId: string,
  ): Promise<{ assessment: Assessment; average: number; count: number }[]> {
    const activityObjectId = new Types.ObjectId(activityId);

    const assessments = await this.assessmentModel.find({
      activity: activityObjectId,
    });

    const assessmentIdSet = new Set(assessments.map((a) => a._id.toString()));

    const results = await queryAll<AssessmentAnswer>({
      model: this.assessmentAnswerModel,
      query: {},
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'answers.assessment' }]),
    });

    const scoreMap = new Map<Assessment, { sum: number; count: number }>();

    for (const result of results.data) {
      for (const answer of result.answers) {
        const assessmentRaw = answer.assessment;

        if (typeof assessmentRaw === 'object' && '_id' in assessmentRaw) {
          const assessment = assessmentRaw as any as Assessment & {
            _id: Types.ObjectId;
          };

          if (!assessmentIdSet.has(assessment._id.toString())) continue;

          const numericAnswer = parseFloat(answer.answer);
          if (!isNaN(numericAnswer)) {
            if (!scoreMap.has(assessment)) {
              scoreMap.set(assessment, { sum: 0, count: 0 });
            }
            const current = scoreMap.get(assessment)!;
            current.sum += numericAnswer;
            current.count += 1;
          }
        } else {
          throw new Error('Assessment not populated');
        }
      }
    }

    const output = Array.from(scoreMap.entries()).map(
      ([assessment, { sum, count }]) => ({
        assessment,
        average: sum / count,
        count,
      }),
    );

    return output;
  }
}
