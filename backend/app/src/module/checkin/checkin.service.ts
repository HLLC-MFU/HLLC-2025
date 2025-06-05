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
    
    await findOrThrow(
      this.userModel,
      new Types.ObjectId(createCheckinDto.user),
      'User not found'
    )

    await findOrThrow(
      this.userModel,
      new Types.ObjectId(createCheckinDto.staff),
      'Staff not found'
    )
  
    for (const activityId of createCheckinDto.activities) {
      await findOrThrow(
        this.activitiesModel,
        new Types.ObjectId(activityId),
        'Activity not found'
      );
    }
  
    const newCheckin = new this.checkinModel({
      user: new Types.ObjectId(createCheckinDto.user),
      staff: new Types.ObjectId(createCheckinDto.staff),
      activities: createCheckinDto.activities.map(activityId => new Types.ObjectId(activityId)),
    });
    
    return newCheckin.save();
  }
  

  async findAll(query: Record<string, string>) {

    return queryAll<Checkin>({
      model: this.checkinModel,
      query: {
        ...query,
        excluded: 'user.password,user.refreshToken,user.role.permissions,user.role.metadataSchema',
      },
      filterSchema: {},
      populateFields: (excluded) =>
        Promise.resolve(
          excluded.includes('school') ? [] : [{ path: 'user' } , {path: 'activities'}] as PopulateField[],
        ),
    });
  }
  async findOne(id: string) {
    return queryFindOne<Checkin>(this.checkinModel, { _id: id }, []);
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
    await findOrThrow(
      this.checkinModel,
      id,
      'Checkin not found'
    )

    return await this.checkinModel.findByIdAndDelete(id);
  }
}