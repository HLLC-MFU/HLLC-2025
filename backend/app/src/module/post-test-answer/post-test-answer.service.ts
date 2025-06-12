import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostTestAnswerDto } from './dto/create-post-test-answer.dto';
import { UpdatePostTestAnswerDto } from './dto/update-post-test-answer.dto';
import { PostTestAnswer, PostTestAnswerDocument } from './schema/post-test-answer.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne, queryUpdateOneByFilter } from 'src/pkg/helper/query.util';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class PostTestAnswerService {

  constructor(
    @InjectModel(PostTestAnswer.name)
    private PostTestAnswerModel: Model<PostTestAnswerDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  async create(createPostTestAnswerDto: CreatePostTestAnswerDto) {
    const { user, answers } = createPostTestAnswerDto

    const userExists = await this.userModel.exists({ _id: user })
    if (!userExists) throw new NotFoundException('User not found')

    const filter = { user: new Types.ObjectId(user) }

    const existinganswers = new Set(
      (await this.PostTestAnswerModel.findOne(filter).select('answers.posttest').lean())
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


    return await queryUpdateOneByFilter<PostTestAnswer>(
      this.PostTestAnswerModel,
      filter,
      update,
      { upsert: true }
    );
  }

  async findAll(query: Record<string, string>) {
    return await queryAll<PostTestAnswer>({
      model: this.PostTestAnswerModel,
      query,
      filterSchema: {}
    })
  }

  async findOne(id: string): Promise<{ data: PostTestAnswer[] | null; message: string }> {
    return await queryFindOne(this.PostTestAnswerModel, { _id: id })
  }

  async update(id: string, updatePostTestAnswerDto: UpdatePostTestAnswerDto) {
    updatePostTestAnswerDto.updateAt = new Date();
    return await queryUpdateOne(this.PostTestAnswerModel, id, updatePostTestAnswerDto)
  }

  async remove(id: string) {
    return await queryDeleteOne(this.PostTestAnswerModel, id)
  }
}
