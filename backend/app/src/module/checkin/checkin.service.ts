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

const userSelectFields = 'name username ';



@Injectable()
export class CheckinService {
  constructor(
    @InjectModel(Checkin.name)
    private readonly checkinModel: Model<CheckinDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Activities.name)
    private readonly activitiesModel: Model<ActivityDocument>,
  ) { }

  async create(createCheckinDto: CreateCheckinDto) {
    let userId: Types.ObjectId;

    // หา user จาก username
    const user = await this.userModel.findOne({ username: createCheckinDto.user });
    if (!user) throw new Error('User not found');
    userId = user._id;

    // ตรวจสอบ activities
    const activityIds = Array.isArray(createCheckinDto.activities)
      ? createCheckinDto.activities.map(id => new Types.ObjectId(id))
      : [];

    for (const id of activityIds) {
      await findOrThrow(this.activitiesModel, id, 'Activity not found');
    }

    // สร้าง checkin ทีละ activity
    const checkins = await Promise.all(
      activityIds.map(activityId => {
        const checkin = new this.checkinModel({
          user: userId,
          staff: new Types.ObjectId(createCheckinDto.staff),
          activities: activityId,
        });
        return checkin.save();
      })
    );

    return checkins;
  }

  async findAll(query: Record<string, string>) {

    return queryAll<Checkin>({
      model: this.checkinModel,
      query,
      filterSchema: {},
      populateFields: (excluded) =>
        Promise.resolve(
          excluded.includes('school') ? [] : [{ path: 'user' } , {path: 'activities'}] as PopulateField[],
        ),
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
