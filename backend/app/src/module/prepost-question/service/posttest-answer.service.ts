import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne, queryUpdateOneByFilter } from 'src/pkg/helper/query.util';
import { PosttestAnswer, PosttestAnswerDocument } from '../schema/posttest-answer.schema';
import { User, UserDocument } from 'src/module/users/schemas/user.schema';
import { CreatePosttestAnswerDto } from '../dto/posttest-answer/create-posttest-answer.dto';
import { UpdatePosttestAnswerDto } from '../dto/posttest-answer/update-posttest-answer.dto';

@Injectable()
export class PosttestAnswerService {

  constructor(
    @InjectModel(PosttestAnswer.name)
    private posttestAnswerModel: Model<PosttestAnswerDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  async create(createPostTestAnswerDto: CreatePosttestAnswerDto) {
    const { user, answers } = createPostTestAnswerDto

    const userExists = await this.userModel.exists({ _id: user })
    if (!userExists) throw new NotFoundException('User not found')

    const filter = { user: new Types.ObjectId(user) }

    const existinganswers = new Set(
      (await this.posttestAnswerModel.findOne(filter).select('answers.question').lean())
      ?.answers.map(v => v.question.toString()) ?? []
    );

    const newAnswers = answers.filter( a => !existinganswers.has(a.question));
    if (!newAnswers.length) throw new BadRequestException('Post-Test answers already exist for this user');

    const answerToInsert = newAnswers.map(answers => ({
      question: new Types.ObjectId(answers.question),
      answer: answers.answer
    }))

    const update = {
      $addToSet: {
        answers: { $each: answerToInsert }
      }
    }


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

  async update(id: string, updatePosttestAnswerDto: UpdatePosttestAnswerDto) {
    updatePosttestAnswerDto.updateAt = new Date();
    return await queryUpdateOne(this.posttestAnswerModel, id, updatePosttestAnswerDto)
  }

  async remove(id: string) {
    return await queryDeleteOne(this.posttestAnswerModel, id)
  }
}
