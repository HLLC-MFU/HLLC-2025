import { Injectable } from '@nestjs/common';
import { CreateActivitiesDto } from './dto/create-activities.dto';
import { UpdateActivityDto } from './dto/update-activities.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Activities, ActivityDocument } from './schema/activities.schema';
import { Model, Types } from 'mongoose';
import { findOrThrow, throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activities.name)
    private activitiesModel: Model<ActivityDocument>,
  ) {}

  async create(createActivitiesDto: CreateActivitiesDto) {
    await throwIfExists(this.activitiesModel, {
      fullName: createActivitiesDto.fullName,
      shortName: createActivitiesDto.shortName,
      type: createActivitiesDto.type,
    });

    const activity = new this.activitiesModel({
      ...createActivitiesDto,
      createdBy: new Types.ObjectId(createActivitiesDto.createdBy),
    });

    try {
      return await activity.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'fullName');
    }
  }

  async findAll(query: Record<string, string>) {
    return queryAll<Activities>({
      model: this.activitiesModel,
      query,
      filterSchema: {},
    });
  }

  async findOne(id: string) {
    return queryFindOne<Activities>(this.activitiesModel, { _id: id }, [
      { path: 'createdBy' },
    ]);
  }

  async update(id: string, updateActivityDto: UpdateActivityDto) {
    if (updateActivityDto.fullName) {
      await findOrThrow(
        this.activitiesModel,
        { fullName: updateActivityDto.fullName },
        'Full name already exists',
      );
    }
    if (updateActivityDto.shortName) {
      await findOrThrow(
        this.activitiesModel,
        { shortName: updateActivityDto.shortName },
        'Short name already exists',
      );
    }
    if (updateActivityDto.type) {
      await findOrThrow(
        this.activitiesModel,
        { type: updateActivityDto.type },
        'Type already exists',
      );
    }
    return queryUpdateOne<Activities>(
      this.activitiesModel,
      id,
      updateActivityDto,
    );
  }

  async remove(id: string) {
    return queryDeleteOne<Activities>(this.activitiesModel, id);
  }
}
