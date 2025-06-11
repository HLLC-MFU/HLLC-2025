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
    const { user, values } = createPostTestAnswerDto

    const userexists = await this.userModel.exists({ _id: user })
    if (!userexists) throw new NotFoundException('User not found')

    const filter = { user: new Types.ObjectId(user) }

    const existingvalues = new Set(
      (await this.PostTestAnswerModel.findOne(filter).select('values.posttest').lean())?.values.map(v => v.posttest.toString()) ?? []
    );

    const newValues = values.filter( a => !existingvalues.has(a.posttest));
    if (!newValues.length) throw new BadRequestException('Post-Test answers already exist for this user');

    const answerToInsert = newValues.map(values => ({
      posttest: new Types.ObjectId(values.posttest),
      value: values.value
    }))

    const update = {
      $addToSet: {
        values: { $each: answerToInsert }
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
    return queryAll<PostTestAnswer>({
      model: this.PostTestAnswerModel,
      query,
      filterSchema: {}
    })
  }

  findOne(id: string): Promise<{ data: PostTestAnswer[] | null; message: string }> {
    return queryFindOne(this.PostTestAnswerModel, { _id: id })
  }

  update(id: string, updatePostTestAnswerDto: UpdatePostTestAnswerDto) {
    return queryUpdateOne(this.PostTestAnswerModel, id, updatePostTestAnswerDto)
  }

  remove(id: string) {
    return queryDeleteOne(this.PostTestAnswerModel, id)
  }
}
