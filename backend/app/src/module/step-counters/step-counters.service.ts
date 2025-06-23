import { Injectable } from '@nestjs/common';
import { CreateStepCounterDto } from './dto/create-step-counter.dto';
import { UpdateStepCounterDto } from './dto/update-step-counter.dto';
import { InjectModel } from '@nestjs/mongoose';
import { StepCounter, StepCounterDocument } from './schema/step-counter.schema';
import { Model } from 'mongoose';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { School, SchoolDocument } from '../schools/schemas/school.schema';
import { Major, MajorDocument } from '../majors/schemas/major.schema';
import { populate } from 'dotenv';

@Injectable()
export class StepCountersService {
  constructor(
    @InjectModel(StepCounter.name)
    private stepCounterModel: Model<StepCounterDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  async create(createStepCounterDto: CreateStepCounterDto) {
    await findOrThrow(
      this.userModel,
      createStepCounterDto.user,
      'User not found',
    );
    const newStepCounter = new this.stepCounterModel({
      ...createStepCounterDto,
      user: createStepCounterDto.user,
    });

    return await newStepCounter.save();
  }

  async findAll(query: Record<string, string>) {
    return await queryAll<StepCounter>({
      model: this.stepCounterModel,
      query,
      filterSchema: {},
      populateFields: () =>
        Promise.resolve([
          {
            path: 'user',
            populate: {
              path: 'metadata.major',
              model: 'Major',
              populate: { path: 'school' },
            },
          },
        ]),
    });
  }

  async findOne(id: string) {
    return await queryFindOne<StepCounter>(this.stepCounterModel, { _id: id });
  }

  async update(id: string, updateStepCounterDto: UpdateStepCounterDto) {
    return await queryUpdateOne<StepCounter>(
      this.stepCounterModel,
      id,
      updateStepCounterDto,
    );
  }

  async remove(id: string) {
    await queryDeleteOne<StepCounter>(this.stepCounterModel, id);
    return {
      message: 'Step counter deleted successfully',
      id,
    };
  }

  async findAllBySchoolId(schoolId: string) {
    const stepCounters = await this.stepCounterModel.find({})
      .populate({
        path: 'user',
        model: 'User',
        populate: {
          path: 'metadata.major',
          model: 'Major',
          populate: {
            path: 'school',
            model: 'School',
          },
        },
      })
      .lean();

    const filtered = stepCounters.filter((sc: any) => {
      const school = sc?.user?.metadata?.major?.school;
      return school && school._id?.toString() === schoolId;
    });

    return {
      data: filtered,
      meta: {
        total: filtered.length,
      },
      message: 'Step counters fetched successfully by school',
    };
  }
}
