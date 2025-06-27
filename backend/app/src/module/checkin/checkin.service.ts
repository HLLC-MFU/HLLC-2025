import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateCheckinDto } from './dto/create-checkin.dto';
import { User } from 'src/module/users/schemas/user.schema';
import { Checkin, CheckinDocument } from './schema/checkin.schema';
import { Role } from '../role/schemas/role.schema';
import { Activities } from 'src/module/activities/schemas/activities.schema';
import { isCheckinAllowed, validateCheckinTime } from './utils/checkin.util';
import { queryAll } from 'src/pkg/helper/query.util';

@Injectable()
export class CheckinService {
  constructor(
    @InjectModel(Checkin.name) private readonly checkinModel: Model<CheckinDocument>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
    @InjectModel(Activities.name)
    private readonly activityModel: Model<Activities>,
  ) {}

  async create(createCheckinDto: CreateCheckinDto): Promise<Checkin[]> {
    const { staff: staffId, user: username, activities } = createCheckinDto;

    if (!username || typeof username !== 'string') {
      throw new BadRequestException('Invalid username');
    }

    const userDoc = await this.userModel.findOne({ username }).select('_id');
    if (!userDoc) {
      throw new BadRequestException('User not found');
    }

    const userObjectId = userDoc._id;
    const staffObjectId = staffId ? new Types.ObjectId(staffId) : undefined;

    if (!Array.isArray(activities) || activities.length === 0) {
      throw new BadRequestException('Activities must be a non-empty array');
    }

    if (staffObjectId) {
      if (!staffId || !Types.ObjectId.isValid(staffId)) {
        throw new BadRequestException('Invalid staff ID');
      }

      const isAllowed = await isCheckinAllowed(
        staffId,
        userObjectId.toString(),
        this.userModel,
        this.roleModel,
      );

      if (!isAllowed) {
        throw new BadRequestException(
          'User is not allowed to be checked in by this staff',
        );
      }
    }

    await validateCheckinTime(activities, this.activityModel);

    const activityObjectIds = activities.map(
      (id) => new Types.ObjectId(`${id}`),
    );

    const existing = await this.checkinModel
      .find({
        user: userObjectId,
        activity: { $in: activityObjectIds },
      })
      .lean();

    const alreadyChecked = new Set(existing.map((e) => e.activity.toString()));
    const filtered = activityObjectIds.filter(
      (id) => !alreadyChecked.has(id.toString()),
    );

    if (filtered.length === 0) {
      throw new BadRequestException(
        'User already checked in to all activities',
      );
    }

    const docs = filtered.map((activityId) => ({
      user: userObjectId,
      activity: activityId,
      ...(staffObjectId && { staff: staffObjectId }),
    }));

    return this.checkinModel.insertMany(docs) as unknown as Checkin[];
  }

  async findAll (query: Record<string,string>) {
    return await queryAll<Checkin>({
      model: this.checkinModel,
      query: {
        ...query
      },
      filterSchema: {},
      populateFields: () =>
        Promise.resolve([
          {path : 'user'},
          {path : 'staff'},
          {path : 'activity'}
        ])
    })
  }
}
