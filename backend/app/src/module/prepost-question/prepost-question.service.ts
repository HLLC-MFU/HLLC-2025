import { Injectable } from '@nestjs/common';
import { CreatePrepostQuestiontDto } from './dto/create-prepost-question.dto';
import { UpdatePrepostQuestiontDto } from './dto/update-prepost-qustion.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PrepostQuestion, PrepostQuestionDocument } from './schema/prepost-question.schema';
import { Model } from 'mongoose';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';

@Injectable()
export class PrepostQuestionService {

  constructor(@InjectModel(PrepostQuestion.name) private PrepostQuestionmodel: Model<PrepostQuestionDocument>) { }

  async create(createPrepostQuestiontDto: CreatePrepostQuestiontDto) {

    await throwIfExists(
      this.PrepostQuestionmodel,
      { question: createPrepostQuestiontDto.question },
      'Question is already exists'
    )

    const posttest = new this.PrepostQuestionmodel({
      ...createPrepostQuestiontDto
    })

    try {
      return await posttest.save()
    } catch (error) {
      handleMongoDuplicateError(error, 'order')
    }
  }

  async findAll(query: Record<string, string>) {
    return queryAll<PrepostQuestion>({
      model: this.PrepostQuestionmodel,
      query,
      filterSchema: {}
    })
  }

  async findOne(id: string): Promise<{ data: PrepostQuestion[] | null; message: string }> {
    const result = await queryFindOne(this.PrepostQuestionmodel, { _id: id })
    return result
  }

  async update(id: string, updatePosttestDto: UpdatePrepostQuestiontDto) {
    updatePosttestDto.updatedAt = new Date()
    return queryUpdateOne<PrepostQuestion>(this.PrepostQuestionmodel, id, updatePosttestDto)
  }

  async remove(id: string) {
    await queryDeleteOne<PrepostQuestion>(this.PrepostQuestionmodel, id)
    return { 
      message: "Posttest deleted successfully",
      id,
    }
  }
}
