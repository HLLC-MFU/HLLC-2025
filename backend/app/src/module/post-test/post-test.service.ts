import { Injectable } from '@nestjs/common';
import { CreatePosttestDto } from './dto/create-post-test.dto';
import { UpdatePosttestDto } from './dto/update-post-test.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PostTest, posttestDocument } from './schema/post-test.schema';
import { Model } from 'mongoose';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';

@Injectable()
export class PosttestService {

  constructor(@InjectModel(PostTest.name) private PosttestModel: Model<posttestDocument>) { }

  async create(createPosttestDto: CreatePosttestDto) {

    await throwIfExists(
      this.PosttestModel,
      { question: createPosttestDto.question },
      'Question is already exists'
    )

    const posttest = new this.PosttestModel({
      ...createPosttestDto
    })

    try {
      return await posttest.save()
    } catch (error) {
      handleMongoDuplicateError(error, 'order')
    }
  }

  async findAll(query: Record<string, string>) {
    return queryAll<PostTest>({
      model: this.PosttestModel,
      query,
      filterSchema: {}
    })
  }

  async findOne(id: string): Promise<{ data: PostTest[] | null; message: string }> {
    const result = await queryFindOne(this.PosttestModel, { _id: id })
    return result
  }

  async update(id: string, updatePosttestDto: UpdatePosttestDto) {
    updatePosttestDto.updatedAt = new Date()
    return queryUpdateOne<PostTest>(this.PosttestModel, id, updatePosttestDto)
  }

  async remove(id: string) {
    await queryDeleteOne<PostTest>(this.PosttestModel, id)
    return { 
      message: "Posttest deleted successfully",
      id,
    }
  }
}
