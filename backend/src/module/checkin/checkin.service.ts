import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { Actions, Role } from '../role/schemas/role.schema';

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
    // Check if user exists
    await findOrThrow(this.userModel, createCheckinDto.user, 'User not found');

    // Check if activity exists
    await findOrThrow(
      this.activitiesModel,
      createCheckinDto.activities,
      'Activity not found',
    );

    const staff = await this.userModel
      .findById(createCheckinDto.staff)
      .populate<{ role: Role }>('role')
      .lean();

    if (!staff || !staff.role) {
      throw new ForbiddenException('Staff user or role not found');
    }

    const rolePermissions = staff.role.permissions;

    if (!rolePermissions.includes('checkin:create')) {
      throw new ForbiddenException(
        'User does not have permission to perform check-in',
      );
    }
    const checkin = new this.checkinModel({
      ...createCheckinDto,
      user: new Types.ObjectId(createCheckinDto.user),
      staff: new Types.ObjectId(createCheckinDto.staff),
      activities: new Types.ObjectId(createCheckinDto.activities),
    });

    return checkin.save();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<Checkin>({
      model: this.checkinModel,
      query,
      filterSchema: {},
      buildPopulateFields: excluded =>
        Promise.resolve([
          { path: 'user' },
          { path: 'staff' },
          { path: 'activities' },
        ]),
    });
  }

  async findOne(id: string) {
    return queryFindOne<Checkin>(this.checkinModel, { _id: id }, [
      { path: 'user' },
      { path: 'staff' },
      { path: 'activities' },
    ]);
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
