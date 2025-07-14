import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { CreatePrepostQuestiontDto } from '../dto/prepost-question/create-prepost-question.dto';
import { UpdatePrepostQuestiontDto } from '../dto/prepost-question/update-prepost-qustion.dto';
import {
  PrepostQuestion,
  PrepostQuestionDocument,
} from '../schema/prepost-question.schema';

@Injectable()
export class PrepostQuestionsService {
  constructor(
    @InjectModel(PrepostQuestion.name)
    private PrepostQuestionmodel: Model<PrepostQuestionDocument>,
  ) {}

  async create(
    createDto: CreatePrepostQuestiontDto | CreatePrepostQuestiontDto[],
  ) {
    const isArray = Array.isArray(createDto);
    if (isArray) {
      return await this.PrepostQuestionmodel.insertMany(createDto);
    } else {
      const single = new this.PrepostQuestionmodel(createDto);
      return await single.save();
    }
  }

  async findAll(query: Record<string, string>) {
    return queryAll<PrepostQuestion>({
      model: this.PrepostQuestionmodel,
      query,
      filterSchema: {},
    });
  }

  async findOne(
    id: string,
  ): Promise<{ data: PrepostQuestion[] | null; message: string }> {
    const result = await queryFindOne(this.PrepostQuestionmodel, { _id: id });
    return result;
  }

  async update(
    id: string,
    updatePrepostQuestiontDto: UpdatePrepostQuestiontDto,
  ) {
    return queryUpdateOne<PrepostQuestion>(
      this.PrepostQuestionmodel,
      id,
      updatePrepostQuestiontDto,
    );
  }

  async remove(id: string) {
    await queryDeleteOne<PrepostQuestion>(this.PrepostQuestionmodel, id);
    return {
      message: 'PrepostQuestion deleted successfully',
      id,
    };
  }
}
