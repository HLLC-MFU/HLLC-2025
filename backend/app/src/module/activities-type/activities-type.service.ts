import { Injectable } from '@nestjs/common';
import { CreateActivitiesTypeDto } from './dto/create-activities-type.dto';
import { UpdateActivitiesTypeDto } from './dto/update-activities-type.dto';
import { InjectModel } from '@nestjs/mongoose';
import { model, Model } from 'mongoose';
import { ActivitiesType, ActivitiesTypeDocument } from './schema/activitiesType.schema';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';

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
    )

    const activitiesType = new this.activitiesTypeModel({
      ...createActivitiesTypeDto,
    });

    return activitiesType.save();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<ActivitiesType>({
      model: this.activitiesTypeModel,
      query,
      filterSchema: {},
    });
  }

  async findOne(id: string) {
    return queryFindOne<ActivitiesType>(
      this.activitiesTypeModel,
      { _id: id },
    );
  }

  async update(id: string, updateActivitiesTypeDto: UpdateActivitiesTypeDto) {
    return queryUpdateOne<ActivitiesType>(
      this.activitiesTypeModel,
      id,
      updateActivitiesTypeDto,
    );
  }

  async remove(id: string) {
    return queryDeleteOne<ActivitiesType>(
      this.activitiesTypeModel,
      id,
    );
  }
}
