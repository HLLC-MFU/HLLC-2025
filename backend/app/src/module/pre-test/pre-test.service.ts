import { Injectable } from '@nestjs/common';
import { CreatePreTestDto } from './dto/create-pre-test.dto';
import { UpdatePreTestDto } from './dto/update-pre-test.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PreTest, PreTestDocument } from './schema/pre-test.schema';
import { Model } from 'mongoose';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { queryAll, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';

@Injectable()
export class PreTestService {

  constructor(@InjectModel(PreTest.name) private PreTestModel: Model<PreTestDocument>) { }

  async create(createPreTestDto: CreatePreTestDto) {

    await throwIfExists(
      this.PreTestModel,
      { question: createPreTestDto.question },
      'Question is already exists'
    )

    const pretest = new this.PreTestModel({
      ...createPreTestDto
    })

    try {
      return await pretest.save()
    } catch (error) {
      handleMongoDuplicateError(error, 'order')
    }
  }

  async findAll(query: Record<string, string>) {
    return queryAll<PreTest>({
      model: this.PreTestModel,
      query,
      filterSchema: {}
    })
  }

  async findOne(id: string): Promise<{ data: PreTest[] | null; message: string }> {
    return queryFindOne(this.PreTestModel, { _id: id })
  }

  async update(id: string, updatePreTestDto: UpdatePreTestDto) {
    updatePreTestDto.updatedAt = new Date()
    return queryUpdateOne<PreTest>(this.PreTestModel, id, updatePreTestDto)
  }

  async remove(id: string) {
    return {
      message: "Posttest deleted successfully",
      id,
    }
  }
}
