import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateCheckinDto } from './dto/create-checkin.dto';
import { User } from 'src/module/users/schemas/user.schema';
import { Checkin } from './schema/checkin.schema';
import { Role } from '../role/schemas/role.schema';
import { Activities } from 'src/module/activities/schemas/activities.schema';
import { isCheckinAllowed, validateCheckinTime } from './utils/checkin.util';
import { SseService } from '../sse/sse.service';

@Injectable()
export class CheckinService {
  constructor(
    @InjectModel(Checkin.name) private readonly checkinModel: Model<Checkin>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
    @InjectModel(Activities.name)
    private readonly activityModel: Model<Activities>,
    private readonly sseService: SseService,
  ) { }

  async create(createCheckinDto: CreateCheckinDto): Promise<Checkin[]> {
    const { staff: staffId, user: userId, activities } = createCheckinDto;

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    if (!Array.isArray(activities) || activities.length === 0) {
      throw new BadRequestException('Activities must be a non-empty array');
    }

    const userObjectId = new Types.ObjectId(userId);
    const staffObjectId = staffId ? new Types.ObjectId(staffId) : undefined;

    if (staffObjectId) {
      if (!staffId || !Types.ObjectId.isValid(staffId)) {
        throw new BadRequestException('Invalid staff ID');
      }

      const isAllowed = await isCheckinAllowed(staffId, userId, this.userModel, this.roleModel);
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
    const docs = filtered.map((activityId) => {
      const doc: {
        user: Types.ObjectId;
        activity: Types.ObjectId;
        staff?: Types.ObjectId;
      } = {
        user: userObjectId,
        activity: activityId,
      };
      if (staffObjectId) {
        doc.staff = staffObjectId;
      }
      return doc;
    });

    this.sseService.sendToUser(userId ,{
      type: 'REFETCH_ACTIVITIES',
    });

    return this.checkinModel.insertMany(docs) as unknown as Checkin[];
  }
}
