import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from 'src/module/users/schemas/user.schema';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOneByFilter,
} from 'src/pkg/helper/query.util';
import { CreatePretestAnswerDto } from '../dto/pretest-answer/create-pretest-answer.dto';
import {
  PretestAnswer,
  PretestAnswerDocument,
} from '../schema/pretest-answer.schema';
import {
  PrepostQuestion,
  PrepostQuestionDocument,
} from '../schema/prepost-question.schema';
import { PrepostQuestionTypes } from '../enum/prepost-question-types.enum';

@Injectable()
export class PretestAnswersService {
  constructor(
    @InjectModel(PretestAnswer.name)
    private pretestAnswerModel: Model<PretestAnswerDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(PrepostQuestion.name)
    private prepostQuestionModel: Model<PrepostQuestionDocument>,
  ) {}

  async create(createPretestAnswerDto: CreatePretestAnswerDto) {
    const { user, answers } = createPretestAnswerDto;

    const userexists = await this.userModel.exists({ _id: user });
    if (!userexists) throw new NotFoundException('User not found');

    const filter = { user: new Types.ObjectId(user) };

    const questionIds = answers.map((a) => new Types.ObjectId(a.pretest));

    const validQuestions = await this.prepostQuestionModel
      .find({
        _id: { $in: questionIds },
        displayType: {
          $in: [PrepostQuestionTypes.PRE],
        },
      })
      .select('_id')
      .lean();

    const validQuestionIds = new Set(
      validQuestions.map((q) => q._id.toString()),
    );

    const invalidQuestions = answers.filter(
      (a) => !validQuestionIds.has(a.pretest),
    );
    if (invalidQuestions.length > 0) {
      throw new BadRequestException(
        'Type of display question in not Both or Pre',
      );
    }

    const existinganswers = new Set(
      (
        await this.pretestAnswerModel
          .findOne(filter)
          .select('answers.pretest')
          .lean()
      )?.answers.map((v) => v.pretest.toString()) ?? [],
    );

    const newAnswers = answers.filter((a) => !existinganswers.has(a.pretest));
    if (!newAnswers.length)
      throw new BadRequestException(
        'Pre-Test answer already exist for this user',
      );

    const answerToInsert = newAnswers.map((answers) => ({
      pretest: new Types.ObjectId(answers.pretest),
      answer: answers.answer,
    }));

    const update = {
      $addToSet: {
        answers: { $each: answerToInsert },
      },
    };
    return await queryUpdateOneByFilter<PretestAnswer>(
      this.pretestAnswerModel,
      filter,
      update,
      { upsert: true },
    );
  }

  async findAll(query: Record<string, string>) {
    return await queryAll<PretestAnswer>({
      model: this.pretestAnswerModel,
      query,
      filterSchema: {},
      populateFields: () =>
        Promise.resolve([
          { path: 'answers.pretest' },
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
        ]),
    });
  }

  async findOne(
    id: string,
  ): Promise<{ data: PretestAnswer[] | null; message: string }> {
    return await queryFindOne(this.pretestAnswerModel, { _id: id });
  }

  async remove(id: string) {
    return await queryDeleteOne(this.pretestAnswerModel, id);
  }

  async averageAllPretests(query: Record<string, string>): Promise<{
    data: { pretest: PrepostQuestion; average: number; count: number }[];
    total: number;
    page: number;
    limit: number;
  }> {
    const fullQuery = { ...query, limit: '0', page: '1' };

    const results = await queryAll<PretestAnswer>({
      model: this.pretestAnswerModel,
      query: fullQuery,
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'answers.pretest' }]),
    });

    const scoreMap = new Map<
      string,
      { pretest: PrepostQuestionDocument; sum: number; count: number }
    >();

    for (const result of results.data) {
      for (const answer of result.answers) {
        const pretest = answer.pretest as any as PrepostQuestionDocument;

        if (pretest && pretest._id) {
          const key = pretest._id.toString();
          const numericAnswer = parseFloat(answer.answer);

          if (!isNaN(numericAnswer)) {
            if (!scoreMap.has(key)) {
              scoreMap.set(key, { pretest, sum: 0, count: 0 });
            }
            const current = scoreMap.get(key)!;
            current.sum += numericAnswer;
            current.count += 1;
          }
        } else {
          throw new Error('Pretest not populated');
        }
      }
    }

    const limit = Number(query.limit);
    const page = Number(query.page ?? 1);
    const offset = limit > 0 ? (page - 1) * limit : 0;
    const allEntries = Array.from(scoreMap.values());
    const paginated = allEntries
      .slice(offset, limit > 0 ? offset + limit : undefined)
      .map(({ pretest, sum, count }) => ({
        pretest,
        average: sum / count,
        count,
      }));

    return {
      data: paginated,
      total: allEntries.length,
      page,
      limit,
    };
  }

  async findByUserId(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const userObjectId = new Types.ObjectId(userId);

    const exists = await this.pretestAnswerModel.exists({ user: userObjectId });

    return {
      data: !!exists,
      message: 'Pretest answer existence checked',
    };
  }
}
