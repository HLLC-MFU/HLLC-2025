import { Injectable } from '@nestjs/common';
import { CreateStepAchievementDto } from '../dto/step-achievement/create-step-achievement.dto';
import { UpdateStepAchievementDto } from '../dto/step-achievement/update-step-achievement.dto';
import { InjectModel } from '@nestjs/mongoose';
import { StepAchievement, StepAchievementDocument } from '../schema/step-achievement.schema';
import { Model } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';

@Injectable()
export class StepAchievementService {
  constructor(@InjectModel(StepAchievement.name)
  private stepAcheivementModel: Model<StepAchievementDocument>
  ) { }
  async create(createStepAchievementDto: CreateStepAchievementDto) {
    const StepAchivement = new this.stepAcheivementModel({
      ...createStepAchievementDto,
    })
    return await StepAchivement.save();
  }

  async findAll(query: Record<string, string>) {
    return await queryAll<StepAchievement>({
      model: this.stepAcheivementModel,
      query,
      filterSchema: {},
    });
  }

  async findOne(id: string) {
    return await queryFindOne<StepAchievement>(this.stepAcheivementModel, { _id: id },)
  }

  async update(id: string, updateStepAchievementDto: UpdateStepAchievementDto) {
    return await queryUpdateOne<StepAchievement>(this.stepAcheivementModel, id, updateStepAchievementDto);
  }

  async remove(id: string) {
    await queryDeleteOne<StepAchievement>(this.stepAcheivementModel, id);
    return {
      message: 'StepAchievement delete successfully',
      id,
    }
  }
}
