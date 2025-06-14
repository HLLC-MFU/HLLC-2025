import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAssessmentAnswerDto } from '../dto/assessment-answers/create-assessment-answer.dto';
import { UpdateAssessmentAnswerDto } from '../dto/assessment-answers/update-assessment-answer.dto';
import { AssessmentAnswer, AssessmentAnswerDocument } from '../schema/assessment-answer.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne, queryUpdateOneByFilter } from 'src/pkg/helper/query.util';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Assessment, AssessmentDocument } from '../schema/assessment.schema';
@Injectable()
export class AssessmentAnswersService {
  constructor(
    @InjectModel(AssessmentAnswer.name)
    private assessmentAnswerModel: Model<AssessmentAnswerDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(Assessment.name)
    private assessmentModel: Model<AssessmentDocument>,
  ) { }


  async create(createAssessmentAnswerDto: CreateAssessmentAnswerDto) {
    const { user, answers } = createAssessmentAnswerDto;

    const userExists = await this.userModel.exists({ _id: user });
    if (!userExists) throw new NotFoundException('User not found');

    const filter = { user: new Types.ObjectId(user) };

    const existingAssessments = new Set(
      (await this.assessmentAnswerModel.findOne(filter).select('answers.assessment').lean())
        ?.answers.map(a => a.assessment.toString()) ?? []
    );

    const newAnswers = answers.filter(a => !existingAssessments.has(a.assessment));
    if (!newAnswers.length) throw new BadRequestException('Assessment answers already exist for this user');

    const update = {
      $addToSet: { answers: { $each: newAnswers.map(a => ({ assessment: new Types.ObjectId(a.assessment), answer: a.answer })) } }
    };

    return await queryUpdateOneByFilter<AssessmentAnswer>(
      this.assessmentAnswerModel,
      filter,
      update,
      { upsert: true }
    );
  }


  async findAll(query: Record<string, string>) {
    return queryAll<AssessmentAnswer>({
      model: this.assessmentAnswerModel,
      query,
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'user' }]),
    });
  }

  async findOne(id: string): Promise<{ data: AssessmentAnswer[] | null; message: string }> {
    const result = await queryFindOne<AssessmentAnswer>(this.assessmentAnswerModel, { _id: id }, [{ path: 'user' }]);
    return result;
  }

  async remove(id: string) {
    await queryDeleteOne<AssessmentAnswer>(this.assessmentAnswerModel, id);
    return {
      message: 'Assessment answer deleted successfully',
      id,
    };
  }

  async averageAllAssessments(): Promise<{ assessmentId: string; average: number; count: number }[]> {
    const results = await queryAll<AssessmentAnswer>({
      model: this.assessmentAnswerModel,
      query: {},
      filterSchema: {},
    });

    const scoreMap: Record<string, { sum: number; count: number }> = {};

    for (const result of results.data) {
      for (const answer of result.answers) {
        const assessmentId = answer.assessment.toString();

        const numericAnswer = parseFloat(answer.answer);
        if (!isNaN(numericAnswer)) {
          if (!scoreMap[assessmentId]) {
            scoreMap[assessmentId] = { sum: 0, count: 0 };
          }
          scoreMap[assessmentId].sum += numericAnswer;
          scoreMap[assessmentId].count += 1;
        }
      }
    }

    const output = Object.entries(scoreMap).map(([assessmentId, { sum, count }]) => ({
      assessmentId,
      average: sum / count,
      count,
    }));

    return output;
  }

  async averageAssessmentsByActivity(activityId: string): Promise<{ assessmentId: string; average: number; count: number }[]> {
    const activityObjectId = new Types.ObjectId(activityId);

    const assessments = await this.assessmentModel.find({ activity: activityObjectId }).lean();
    const assessmentIds = new Set(assessments.map(a => a._id.toString()));

    const results = await queryAll<AssessmentAnswer>({
      model: this.assessmentAnswerModel,
      query: {},
      filterSchema: {},
    });

    const scoreMap: Record<string, { sum: number; count: number }> = {};

    for (const result of results.data) {
      for (const answer of result.answers) {
        const assessmentId = answer.assessment.toString();

        if (!assessmentIds.has(assessmentId)) continue;

        const numericAnswer = parseFloat(answer.answer);
        if (!isNaN(numericAnswer)) {
          if (!scoreMap[assessmentId]) {
            scoreMap[assessmentId] = { sum: 0, count: 0 };
          }
          scoreMap[assessmentId].sum += numericAnswer;
          scoreMap[assessmentId].count += 1;
        }
      }
    }

    const output = Object.entries(scoreMap).map(([assessmentId, { sum, count }]) => ({
      assessmentId,
      average: sum / count,
      count,
    }));

    return output;
  }

}