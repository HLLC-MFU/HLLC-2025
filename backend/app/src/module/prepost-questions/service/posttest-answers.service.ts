import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne, queryUpdateOneByFilter } from 'src/pkg/helper/query.util';
import { PosttestAnswer, PosttestAnswerDocument } from '../schema/posttest-answer.schema';
import { User, UserDocument } from 'src/module/users/schemas/user.schema';
import { CreatePosttestAnswerDto } from '../dto/posttest-answer/create-posttest-answer.dto';
import { PrepostQuestion, PrepostQuestionDocument } from '../schema/prepost-question.schema';
import { PrepostQuestionTypes } from '../enum/prepost-question-types.enum';

@Injectable()
export class PosttestAnswersService {

  constructor(
    @InjectModel(PosttestAnswer.name)
    private posttestAnswerModel: Model<PosttestAnswerDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(PrepostQuestion.name)
    private prepostQuestionModel: Model<PrepostQuestionDocument>

  ) { }

  async create(createPostTestAnswerDto: CreatePosttestAnswerDto) {
    const { user, answers } = createPostTestAnswerDto;

    const userExists = await this.userModel.exists({ _id: user });
    if (!userExists) throw new NotFoundException('User not found');

    const filter = { user: new Types.ObjectId(user) };

    const questionIds = answers.map(a => new Types.ObjectId(a.posttest));

    const validQuestions = await this.prepostQuestionModel.find({
      _id: { $in: questionIds },
      displayType: { $in: [PrepostQuestionTypes.BOTH, PrepostQuestionTypes.POST] }
    }).select('_id').lean();

    const validQuestionIds = new Set(validQuestions.map(q => q._id.toString()));

    const invalidQuestions = answers.filter(a => !validQuestionIds.has(a.posttest));
    if (invalidQuestions.length > 0) {
      throw new BadRequestException('Type of display question in not Both or Post');
    }


    const existingAnswers = new Set(
      (
        await this.posttestAnswerModel
          .findOne(filter)
          .select('answers.posttest')
          .lean()
      )?.answers.map(v => v.posttest.toString()) ?? []
    );

    const newAnswers = answers.filter(a => !existingAnswers.has(a.posttest));
    if (!newAnswers.length) {
      throw new BadRequestException('Post-Test answers already exist for this user');
    }

    const answerToInsert = newAnswers.map(a => ({
      posttest: new Types.ObjectId(a.posttest),
      answer: a.answer
    }));

    const update = {
      $addToSet: {
        answers: { $each: answerToInsert }
      }
    };

    return await queryUpdateOneByFilter<PosttestAnswer>(
      this.posttestAnswerModel,
      filter,
      update,
      { upsert: true }
    );
  }


  async findAll(query: Record<string, string>) {
    return await queryAll<PosttestAnswer>({
      model: this.posttestAnswerModel,
      query,
      filterSchema: {}
    })
  }

  async findOne(id: string): Promise<{ data: PosttestAnswer[] | null; message: string }> {
    return await queryFindOne(this.posttestAnswerModel, { _id: id })
  }

  async remove(id: string) {
    return await queryDeleteOne(this.posttestAnswerModel, id)
  }

  async averageAllPosttests(): Promise<{ posttestId: string; average: number; count: number }[]> {
    const results = await queryAll<PosttestAnswer>({
      model: this.posttestAnswerModel,
      query: {},
      filterSchema: {},
    });

    const scoreMap: Record<string, { sum: number; count: number }> = {};

    for (const result of results.data) {
      for (const answer of result.answers) {
        const posttestId = answer.posttest.toString();

        const numericAnswer = parseFloat(answer.answer);
        if (!isNaN(numericAnswer)) {
          if (!scoreMap[posttestId]) {
            scoreMap[posttestId] = { sum: 0, count: 0 };
          }
          scoreMap[posttestId].sum += numericAnswer;
          scoreMap[posttestId].count += 1;
        }
      }
    }

    const output: { posttestId: string; average: number; count: number }[] = [];
    for (const posttestId in scoreMap) {
      const { sum, count } = scoreMap[posttestId];
      output.push({
        posttestId,
        average: count > 0 ? sum / count : 0,
        count
      });
    }
    return output;
  }
}