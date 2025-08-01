import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOneByFilter,
} from 'src/pkg/helper/query.util';
import {
  PosttestAnswer,
  PosttestAnswerDocument,
} from '../schema/posttest-answer.schema';
import { User, UserDocument } from 'src/module/users/schemas/user.schema';
import { CreatePosttestAnswerDto } from '../dto/posttest-answer/create-posttest-answer.dto';
import {
  PrepostQuestion,
  PrepostQuestionDocument,
} from '../schema/prepost-question.schema';
import { PrepostQuestionTypes } from '../enum/prepost-question-types.enum';
import {
  TimeSetting,
  TimeSettingDocument,
} from 'src/module/time-setting/schema/time-setting.schema';

@Injectable()
export class PosttestAnswersService {
  constructor(
    @InjectModel(PosttestAnswer.name)
    private posttestAnswerModel: Model<PosttestAnswerDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(PrepostQuestion.name)
    private prepostQuestionModel: Model<PrepostQuestionDocument>,

    @InjectModel(TimeSetting.name)
    private timeSettingModel: Model<TimeSettingDocument>,
  ) {}

  async create(createPostTestAnswerDto: CreatePosttestAnswerDto) {
    const { user, answers } = createPostTestAnswerDto;

    const userExists = await this.userModel.exists({ _id: user });
    if (!userExists) throw new NotFoundException('User not found');

    const filter = { user: new Types.ObjectId(user) };

    const questionIds = answers.map((a) => new Types.ObjectId(a.posttest));

    const validQuestions = await this.prepostQuestionModel
      .find({
        _id: { $in: questionIds },
        displayType: {
          $in: [PrepostQuestionTypes.POST],
        },
      })
      .select('_id')
      .lean();

    const validQuestionIds = new Set(
      validQuestions.map((q) => q._id.toString()),
    );

    const invalidQuestions = answers.filter(
      (a) => !validQuestionIds.has(a.posttest),
    );
    if (invalidQuestions.length > 0) {
      throw new BadRequestException(
        'Type of display question in not Both or Post',
      );
    }

    const existingAnswers = new Set(
      (
        await this.posttestAnswerModel
          .findOne(filter)
          .select('answers.posttest')
          .lean()
      )?.answers.map((v) => v.posttest.toString()) ?? [],
    );

    const newAnswers = answers.filter((a) => !existingAnswers.has(a.posttest));
    if (!newAnswers.length) {
      throw new BadRequestException(
        'Post-Test answers already exist for this user',
      );
    }

    const answerToInsert = newAnswers.map((a) => ({
      posttest: new Types.ObjectId(a.posttest),
      answer: a.answer,
    }));

    const update = {
      $addToSet: {
        answers: { $each: answerToInsert },
      },
    };

    return await queryUpdateOneByFilter<PosttestAnswer>(
      this.posttestAnswerModel,
      filter,
      update,
      { upsert: true },
    );
  }

  async findAll(query: Record<string, string>) {
    return await queryAll<PosttestAnswer>({
      model: this.posttestAnswerModel,
      query,
      filterSchema: {},
      populateFields: () =>
        Promise.resolve([
          { path: 'answers.posttest' },
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
  ): Promise<{ data: PosttestAnswer[] | null; message: string }> {
    return await queryFindOne(this.posttestAnswerModel, { _id: id });
  }

  async remove(id: string) {
    return await queryDeleteOne(this.posttestAnswerModel, id);
  }

  async averageAllPosttests(query: Record<string, string>): Promise<{
    data: { posttest: PrepostQuestion; average: number; count: number }[];
    total: number;
    page: number;
    limit: number;
  }> {
    const fullQuery = { ...query, limit: '0', page: '1' };

    const results = await queryAll<PosttestAnswer>({
      model: this.posttestAnswerModel,
      query: fullQuery,
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'answers.posttest' }]),
    });

    const scoreMap = new Map<
      string,
      { posttest: PrepostQuestionDocument; sum: number; count: number }
    >();

    for (const result of results.data) {
      for (const answer of result.answers) {
        const posttest = answer.posttest as any as PrepostQuestionDocument;

        if (posttest && posttest._id) {
          const key = posttest._id.toString();
          const numericAnswer = parseFloat(answer.answer);

          if (!isNaN(numericAnswer)) {
            if (!scoreMap.has(key)) {
              scoreMap.set(key, { posttest, sum: 0, count: 0 });
            }
            const current = scoreMap.get(key)!;
            current.sum += numericAnswer;
            current.count += 1;
          }
        } else {
          throw new Error('Posttest not populated');
        }
      }
    }

    const limit = Number(query.limit);
    const page = Number(query.page ?? 1);
    const offset = limit > 0 ? (page - 1) * limit : 0;
    const allEntries = Array.from(scoreMap.values());
    const paginated = allEntries
      .slice(offset, limit > 0 ? offset + limit : undefined)
      .map(({ posttest, sum, count }) => ({
        posttest,
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
    const exists = await this.posttestAnswerModel.exists({
      user: userObjectId,
    });

    const firstTimeSetting = await this.timeSettingModel
      .findOne()
      .sort({ _id: 1 })
      .lean();

    const dueDate = firstTimeSetting
      ? new Date() > new Date(firstTimeSetting.date)
      : false;

    return {
      data: !!exists,
      dueDate,
      message: 'Posttest answer existence checked',
    };
  }
}
