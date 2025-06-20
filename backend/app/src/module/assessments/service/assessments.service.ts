import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { CreateAssessmentDto } from '../dto/assessments/create-assessment.dto';
import { UpdateAssessmentDto } from '../dto/assessments/update-assessment.dto';
import { Assessment, AssessmentDocument } from '../schema/assessment.schema';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectModel(Assessment.name)
    private assessmentModel: Model<AssessmentDocument>,
  ) {}

  async create(createAssessmentDto: CreateAssessmentDto) {
    const assessment = new this.assessmentModel({
      ...createAssessmentDto,
    });

    return await assessment.save();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<Assessment>({
      model: this.assessmentModel,
      query,
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'activity' }]),
    });
  }

  async findOne(
    id: string,
  ): Promise<{ data: Assessment[] | null; message: string }> {
    const result = await queryFindOne(this.assessmentModel, { _id: id });
    return result;
  }

  async update(id: string, updateAssessmentDto: UpdateAssessmentDto) {
    return queryUpdateOne<Assessment>(
      this.assessmentModel,
      id,
      updateAssessmentDto,
    );
  }

  async remove(id: string) {
    await queryDeleteOne<Assessment>(this.assessmentModel, id);
    return {
      message: 'Assessment deleted successfully',
      id,
    };
  }

  async findAllByActivity(activityId: string) {
    return queryAll<Assessment>({
      model: this.assessmentModel,
      query: { activity: activityId },
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'activity' }]),
    });
  }
}
