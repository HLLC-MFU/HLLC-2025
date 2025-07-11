import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateCheckinDto } from './dto/create-checkin.dto';
import { User, UserDocument } from 'src/module/users/schemas/user.schema';
import { Checkin, CheckinDocument } from './schema/checkin.schema';
import { Role, RoleDocument } from '../role/schemas/role.schema';
import { Activities, ActivityDocument } from 'src/module/activities/schemas/activities.schema';
import { isCheckinAllowed, validateCheckinTime } from './utils/checkin.util';
import { queryAll } from 'src/pkg/helper/query.util';
import { Major, MajorDocument } from '../majors/schemas/major.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { PushNotificationService } from '../notifications/push-notifications.service';

@Injectable()
export class CheckinService {
  constructor(
    @InjectModel(Checkin.name) private checkinModel: Model<CheckinDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Activities.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(Major.name) private majorModel: Model<MajorDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationService: PushNotificationService,
  ) { }

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
        this.majorModel,
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

    const checkIn = await this.checkinModel.insertMany(docs) as unknown as Checkin[];
    if (!checkIn) {
      throw new BadRequestException('Not found User to Notification');
    }

    // 1️⃣ สร้าง Notification DB + SSE
    await this.notificationsService.create({
      title: {
        en: 'Checked in',
        th: 'เช็คอิน',
      },
      subtitle: {
        en: '',
        th: '',
      },
      body: {
        en: `You have been checked in successfully.`,
        th: `เช็คอินสำเร็จแล้ว`,
      },
      icon: 'check-circle',
      scope: [
        {
          type: 'individual',
          id: [userObjectId.toString()],
        },
      ],
    });

    // 2️⃣ ยิง FCM
    await this.pushNotificationService.sendPushNotification({
      title: 'Checked in',
      body: 'You are now checked in!',
      receivers: {
        users: [userObjectId.toString()],
      },
    }, false);

    return checkIn;
  }

  async findCheckedInUser(activityId: string) {
    const activityObjectId = new Types.ObjectId(activityId);
    const checkin = await this.checkinModel.find({ activity: activityObjectId, })
      .populate('user').populate('staff');
    return checkin;
  }
}
