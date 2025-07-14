import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { User, UserDocument } from 'src/module/users/schemas/user.schema';
import { Checkin, CheckinDocument } from './schema/checkin.schema';
import { Role, RoleDocument } from '../role/schemas/role.schema';
import { Activities, ActivityDocument } from 'src/module/activities/schemas/activities.schema';
import { isCheckinAllowed, validateCheckinTime } from './utils/checkin.util';
import { Major, MajorDocument } from '../majors/schemas/major.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { decryptItem } from '../auth/utils/crypto';

@Injectable()
export class CheckinService {
  constructor(
    @InjectModel(Checkin.name) private checkinModel: Model<CheckinDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Activities.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(Major.name) private majorModel: Model<MajorDocument>,
    private readonly notificationsService: NotificationsService,
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

    let isAdmin = false;

    if (staffObjectId) {
      const staffDoc = await this.userModel
        .findById(staffId)
        .populate({
          path: 'role',
          select: 'permissions',
          model: this.roleModel,
        })
        .lean<{ role?: { permissions?: string[] } }>();

      isAdmin = hasAdminPermission(staffDoc?.role?.permissions);
    } else {
      const userDocWithRole = await this.userModel
        .findById(userObjectId)
        .populate({
          path: 'role',
          select: 'permissions',
          model: this.roleModel,
        })
        .lean<{ role?: { permissions?: string[] } }>();

      isAdmin = hasAdminPermission(userDocWithRole?.role?.permissions);
    }

    await validateCheckinTime(activities, this.activityModel, isAdmin);
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

    const checkIn = (await this.checkinModel.insertMany(docs)) as unknown as Checkin[];
    if (!checkIn) {
      throw new BadRequestException('Not found User to Notification');
    }

    const activityDocs = await this.activityModel
      .find({ _id: { $in: activityObjectIds } })
      .select('name photo')
      .lean();

    const activityNamesEn = activityDocs
      .map((activity) => activity.name?.en)
      .filter(Boolean)
      .join(', ');
    const activityNamesTh = activityDocs
      .map((activity) => activity.name?.th)
      .filter(Boolean)
      .join(', ');

    const activitiesImage = activityDocs.find(
      (a) => a.photo?.bannerPhoto,
    )?.photo?.bannerPhoto;

    console.log(activitiesImage);

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
        en: `You have been checked in to ${activityNamesEn} successfully.`,
        th: `เช็คอินกิจกรรม ${activityNamesTh} สำเร็จแล้ว`,
      },
      icon: 'check-circle',
      image: activitiesImage,
      scope: [
        {
          type: 'user',
          id: [userObjectId.toString()],
        },
      ],
    });

    return checkIn;
  }

  async findCheckedInUser(activityId: string) {
    const activityObjectId = new Types.ObjectId(activityId);
    const checkin = await this.checkinModel
      .find({ activity: activityObjectId })
      .populate('user')
      .populate('staff');
    return checkin;
  }
}

function hasAdminPermission(perms?: string[]) {
  if (!Array.isArray(perms)) return false;
  return perms.some(p => {
    try {
      return decryptItem(p) === '*';
    } catch (err) {
      console.warn('Decrypt failed:', err);
      return false;
    }
  });
}