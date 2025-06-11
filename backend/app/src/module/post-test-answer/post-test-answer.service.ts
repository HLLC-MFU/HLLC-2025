import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostTestAnswerDto } from './dto/create-post-test-answer.dto';
import { UpdatePostTestAnswerDto } from './dto/update-post-test-answer.dto';
import { PostTestAnswer, PostTestAnswerDocument } from './schema/post-test-answer.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne, queryUpdateOneByFilter } from 'src/pkg/helper/query.util';

@Injectable()
export class PostTestAnswerService {

  constructor(@InjectModel(PostTestAnswer.name) private PostTestAnswerModel: Model<PostTestAnswerDocument>) { }

  async create(createPostTestAnswerDto: CreatePostTestAnswerDto) {

    const exists = await this.PostTestAnswerModel.exists({_id: createPostTestAnswerDto.user})
    if (!exists) throw new NotFoundException('User not found')

    const filter = { user: new Types.ObjectId(createPostTestAnswerDto.user)}
    const answerToInsert = createPostTestAnswerDto.values.map(values =>({
      posttest: new Types.ObjectId(values.posttest),
      value: values.value
    }))
    const update = {
      $addToSet: {
        value: { $each: answerToInsert }
      }
    }


    return await queryUpdateOneByFilter<PostTestAnswer>(
      this.PostTestAnswerModel,
      filter,
      update
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
