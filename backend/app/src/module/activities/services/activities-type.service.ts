import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ActivitiesType,
  ActivitiesTypeDocument,
} from '../schemas/activitiesType.schema';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { CreateActivitiesTypeDto } from '../dto/activities-type/create-activities-type.dto';
import { UpdateActivitiesTypeDto } from '../dto/activities-type/update-activities-type.dto';

@Injectable()
export class ActivitiesTypeService {
  constructor(
    @InjectModel(ActivitiesType.name)
    private activitiesTypeModel: Model<ActivitiesTypeDocument>,
  ) {}

  async create(createActivitiesTypeDto: CreateActivitiesTypeDto) {
    await throwIfExists(
      this.activitiesTypeModel,
      { name: createActivitiesTypeDto.name },
      'Activities type already exists',
    );

    const activitiesType = new this.activitiesTypeModel({
      ...createActivitiesTypeDto,
    });

    try {
      return await activitiesType.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'name');
    }
  }

  async findAll(query: Record<string, string>) {
    return queryAll<ActivitiesType>({
      model: this.activitiesTypeModel,
      query,
      filterSchema: {},
    });
  }

  async findOne(id: string) {
    return queryFindOne<ActivitiesType>(this.activitiesTypeModel, { _id: id });
  }

  async update(id: string, updateActivitiesTypeDto: UpdateActivitiesTypeDto) {
    return queryUpdateOne<ActivitiesType>(
      this.activitiesTypeModel,
      id,
      updateActivitiesTypeDto,
    );
  }

  async remove(id: string) {
    await queryDeleteOne<ActivitiesType>(this.activitiesTypeModel, id);

    return {
      message: 'Activities type deleted successfully',
      id,
    };
  }
}
