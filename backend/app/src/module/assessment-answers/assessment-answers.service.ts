import { Injectable } from '@nestjs/common';
import { CreateAssessmentAnswerDto } from './dto/create-assessment-answer.dto';
import { UpdateAssessmentAnswerDto } from './dto/update-assessment-answer.dto';
import { AssessmentAnswer, AssessmentAnswerDocument } from './schema/assessment-answer.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';

@Injectable()
export class AssessmentAnswersService {
  constructor(@InjectModel(AssessmentAnswer.name) private assessmentAnswerModel: Model<AssessmentAnswerDocument>,) { }

  async create(createAssessmentAnswerDto: CreateAssessmentAnswerDto) {
    const assessmentAnswer = new this.assessmentAnswerModel({
      ...createAssessmentAnswerDto,
    });

    try {
      return await assessmentAnswer.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'assessment-answers');
    }
  }

  async findAll(query: Record<string, string>) {
    return queryAll<AssessmentAnswer>({
      model: this.assessmentAnswerModel,
      query,
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'user' }]),
    });
  }

  async findOne(id: string): Promise<{ data: AssessmentAnswer[] | null; message: string }> {
    const result = await queryFindOne<AssessmentAnswer>(this.assessmentAnswerModel, { _id: id }, [{ path: 'user' }]);
    return result;
  }

  async update(id: string, updateAssessmentAnswerDto: UpdateAssessmentAnswerDto) {
    updateAssessmentAnswerDto.updatedAt = new Date();
    return queryUpdateOne<AssessmentAnswer>(this.assessmentAnswerModel, id, updateAssessmentAnswerDto);
  }

  async remove(id: string) {
    await queryDeleteOne<AssessmentAnswer>(this.assessmentAnswerModel, id);
    return {
      message: 'Assessment answer deleted successfully',
      id,
    };
  }
}
