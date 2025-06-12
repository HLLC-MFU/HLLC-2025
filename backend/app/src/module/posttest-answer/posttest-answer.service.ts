import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePosttestAnswerDto } from './dto/create-posttest-answer.dto';
import { UpdatePosttestAnswerDto } from './dto/update-posttest-answer.dto';
import { PosttestAnswer, PosttestAnswerDocument } from './schema/posttest-answer.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne, queryUpdateOneByFilter } from 'src/pkg/helper/query.util';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class PosttestAnswerService {

  constructor(
    @InjectModel(PosttestAnswer.name)
    private PosttestAnswerModel: Model<PosttestAnswerDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  async create(createPostTestAnswerDto: CreatePosttestAnswerDto) {
    const { user, answers } = createPostTestAnswerDto

    const userExists = await this.userModel.exists({ _id: user })
    if (!userExists) throw new NotFoundException('User not found')

    const filter = { user: new Types.ObjectId(user) }

    const existinganswers = new Set(
      (await this.PosttestAnswerModel.findOne(filter).select('answers.posttest').lean())
      ?.answers.map(v => v.posttest.toString()) ?? []
    );

    const newAnswers = answers.filter( a => !existinganswers.has(a.posttest));
    if (!newAnswers.length) throw new BadRequestException('Post-Test answers already exist for this user');

    const answerToInsert = newAnswers.map(answers => ({
      posttest: new Types.ObjectId(answers.posttest),
      answer: answers.answer
    }))

    const update = {
      $addToSet: {
        answers: { $each: answerToInsert }
      }
    }


    return await queryUpdateOneByFilter<PosttestAnswer>(
      this.PosttestAnswerModel,
      filter,
      update,
      { upsert: true }
    );
  }

  async findAll(query: Record<string, string>) {
    return await queryAll<PosttestAnswer>({
      model: this.PosttestAnswerModel,
      query,
      filterSchema: {}
    })
  }

  async findOne(id: string): Promise<{ data: PosttestAnswer[] | null; message: string }> {
    return await queryFindOne(this.PosttestAnswerModel, { _id: id })
  }

  async update(id: string, updatePosttestAnswerDto: UpdatePosttestAnswerDto) {
    updatePosttestAnswerDto.updateAt = new Date();
    return await queryUpdateOne(this.PosttestAnswerModel, id, updatePosttestAnswerDto)
  }

  async remove(id: string) {
    return await queryDeleteOne(this.PosttestAnswerModel, id)
  }
}
