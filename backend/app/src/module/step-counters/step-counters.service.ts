import { Injectable } from '@nestjs/common';
import { CreateStepCounterDto } from './dto/create-step-counter.dto';
import { UpdateStepCounterDto } from './dto/update-step-counter.dto';
import { InjectModel } from '@nestjs/mongoose';
import { StepCounter, StepCounterDocument } from './schema/step-counter.schema';
import { Model } from 'mongoose';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { User, UserDocument } from '../users/schemas/user.schema';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';
import { School, SchoolDocument } from '../schools/schemas/school.schema';
import { Major } from '../majors/schemas/major.schema';

@Injectable()
export class StepCountersService {
  constructor(
    @InjectModel(StepCounter.name)
    private stepCounterModel: Model<StepCounterDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(School.name)
    private schoolModel: Model<SchoolDocument>
  ) { }

  async create(createStepCounterDto: CreateStepCounterDto) {
    await findOrThrow(
      this.userModel,
      createStepCounterDto.user, 'User not found'
    );
    const newStepCounter = new this.stepCounterModel({
      ...createStepCounterDto,
      user: createStepCounterDto.user
    });

    return await newStepCounter.save();
  }

  async findAll(query: Record<string, string>) {
    return await queryAll<StepCounter>({
      model: this.stepCounterModel,
      query,
      filterSchema: {},
      populateFields: excluded =>
        Promise.resolve(excluded.includes('user') ? [] : [{ path: 'user' }]),
    });
  }

  async findOne(id: string) {
    return await queryFindOne<StepCounter>
      (this.stepCounterModel, { _id: id },);
  }

  async update(id: string, updateStepCounterDto: UpdateStepCounterDto) {
    return await queryUpdateOne<StepCounter>(this.stepCounterModel, id, updateStepCounterDto);
  }

  async remove(id: string) {
    await queryDeleteOne<StepCounter>(this.stepCounterModel, id);
    return {
      message: 'Step counter deleted successfully',
      id,
    }
  }

async listUsersBySchoolId(schoolId: string) {
  const all = await queryAll<User>({
    model: this.userModel,
    query: {}, 
    filterSchema: {},
    populateFields: () =>
      Promise.resolve([
        {
          path: 'metadata.major',
          model: 'Major',
          populate: {
            path: 'school',
          },
        },
      ]),
  });

  const filtered = all.data.filter(
    (user) =>
      user.metadata?.major &&
      typeof user.metadata.major === 'object' &&
      (user.metadata.major as Major).school?._id?.toString() === schoolId,
  );

  return {
    ...all,
    data: filtered,
    meta: {
      ...all.meta,
      total: filtered.length,
    },
  };
}

}
