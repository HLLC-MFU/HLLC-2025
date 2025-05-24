import { Injectable } from '@nestjs/common';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UpdateCheckinDto } from './dto/update-checkin.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Checkin, CheckinDocument } from './schema/checkin.schema';
import { Model, Types } from 'mongoose';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { User } from '../users/schemas/user.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { Activities } from '../activities/schema/activities.schema';
import { ActivityDocument } from '../activities/schema/activities.schema';
import { PopulateField } from 'src/pkg/types/query';

const userSelectFields = 'name username major metadata createdAt updatedAt';

@Injectable()
export class CheckinService {
  constructor(
    @InjectModel(Checkin.name)
    private readonly checkinModel: Model<CheckinDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Activities.name)
    private readonly activitiesModel: Model<ActivityDocument>,
  ) {}

  async create(createCheckinDto: CreateCheckinDto) {
    if (createCheckinDto.user) {
      await findOrThrow(
        this.userModel,
        createCheckinDto.user,
        'User not found',
      );
    }

    if (createCheckinDto.activities) {
      await findOrThrow(
        this.activitiesModel,
        createCheckinDto.activities,
        'Activity not found',
      );
    }

    if (createCheckinDto.staff) {
      await findOrThrow(
        this.userModel,
        createCheckinDto.staff,
        'Staff not found',
      );
    }

    const checkin = new this.checkinModel({
      ...createCheckinDto,
      user: createCheckinDto.user
        ? new Types.ObjectId(createCheckinDto.user)
        : null,
      staff: createCheckinDto.staff
        ? new Types.ObjectId(createCheckinDto.staff)
        : null,
      activities: createCheckinDto.activities
        ? new Types.ObjectId(createCheckinDto.activities)
        : null,
    });

    return checkin.save();
  }

  async findAll(query: Record<string, string>) {
    const populateFields: PopulateField[] = [
      { path: 'user', select: userSelectFields },
      { path: 'staff', select: userSelectFields },
      { path: 'activities' },
    ];

    return queryAll<Checkin>({
      model: this.checkinModel,
      query,
      filterSchema: {},
      buildPopulateFields: excluded => Promise.resolve(populateFields),
    });
  }

  async findOne(id: string) {
    const populateFields: PopulateField[] = [
      { path: 'user', select: userSelectFields },
      { path: 'staff', select: userSelectFields },
      { path: 'activities' },
    ];

    return queryFindOne<Checkin>(
      this.checkinModel,
      { _id: id },
      populateFields,
    );
  }

  async update(id: string, updateCheckinDto: UpdateCheckinDto) {
    if (updateCheckinDto.user) {
      await findOrThrow(
        this.userModel,
        updateCheckinDto.user,
        'User not found',
      );
    }

    if (updateCheckinDto.staff) {
      await findOrThrow(
        this.userModel,
        updateCheckinDto.staff,
        'Staff not found',
      );
    }

    if (updateCheckinDto.activities) {
      await findOrThrow(
        this.activitiesModel,
        updateCheckinDto.activities,
        'Activities not found',
      );
    }
    return queryUpdateOne<Checkin>(this.checkinModel, id, updateCheckinDto);
  }

  async remove(id: string) {
    return queryDeleteOne<Checkin>(this.checkinModel, id);
  }
}
