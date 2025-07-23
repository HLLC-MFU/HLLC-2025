import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { User, UserDocument } from 'src/module/users/schemas/user.schema';
import { Checkin, CheckinDocument } from './schema/checkin.schema';
import { Role, RoleDocument } from '../role/schemas/role.schema';
import {
  Activities,
  ActivityDocument,
} from 'src/module/activities/schemas/activities.schema';
import { validateCheckinTime } from './utils/checkin.util';
import { Major, MajorDocument } from '../majors/schemas/major.schema';
import { NotificationsService } from '../notifications/notifications.service';

import { SseService } from '../sse/sse.service';
import { queryAll, queryFindOne } from 'src/pkg/helper/query.util';
import { Logger } from '@nestjs/common';

@Injectable()
export class CheckinService {
  constructor(
    @InjectModel(Checkin.name) private checkinModel: Model<CheckinDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Activities.name)
    private activityModel: Model<ActivityDocument>,
    @InjectModel(Major.name) private majorModel: Model<MajorDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly sseService: SseService,
  ) {}

  async create(createCheckinDto: CreateCheckinDto): Promise<Checkin[]> {
    const { staff: staffId, user: username, activities } = createCheckinDto;

    if (!username || typeof username !== 'string') {
      throw new BadRequestException('Invalid username');
    }
    if (!staffId || !Types.ObjectId.isValid(staffId)) {
      throw new BadRequestException('Invalid staff ID');
    }
    if (!Array.isArray(activities) || activities.length === 0) {
      throw new BadRequestException('Activities must be a non-empty array');
    }

    const staffObjectId = new Types.ObjectId(staffId);

    const [userDoc, staffDoc] = await Promise.all([
      this.userModel
        .findOne({ username })
        .select('_id role')
        .populate<{ role: RoleDocument }>('role')
        .lean(),
      this.userModel
        .findById(staffObjectId)
        .select('role')
        .populate<{ role: RoleDocument }>('role')
        .lean(),
    ]);

    if (!userDoc) throw new BadRequestException('User not found');
    if (!staffDoc) throw new BadRequestException('Staff not found');

    const userObjectId = userDoc._id;

    const targetRole = userDoc.role?.name?.trim().toUpperCase();
    const staffRole = staffDoc.role?.name?.trim().toUpperCase();

    if (!targetRole)
      throw new BadRequestException('Target user role not found');
    if (!staffRole) throw new BadRequestException('Staff role not found');

    const invalidRoles: Record<string, string[]> = {
      STAFF: ['ADMINISTRATOR'],
      SMO: ['ADMINISTRATOR', 'MENTEE', 'SMO'],
    };

    if (staffRole !== 'ADMINISTRATOR') {
      if (userObjectId.toString() === staffObjectId.toString()) {
        throw new BadRequestException('Cannot check-in yourself');
      }
      const baseRole = ['MENTEE', 'SMO'].find((r) => staffRole.startsWith(r));
      if (!baseRole) {
        throw new BadRequestException(
          'You are not allowed to check-in other users',
        );
      }
      const invalidTargets = invalidRoles[baseRole] || [];
      if (invalidTargets.some((r) => targetRole.startsWith(r))) {
        throw new BadRequestException(
          `${staffRole} cannot check-in ${targetRole}`,
        );
      }
    }

    const activityObjectIds = activities.map((id) => new Types.ObjectId(id));
   const isAdmin = ['ADMINISTRATOR', 'MENTEE'].includes(staffRole);

    await validateCheckinTime(activities, this.activityModel, isAdmin);

    const [existing, activityDocs] = await Promise.all([
      this.checkinModel
        .find({ user: userObjectId, activity: { $in: activityObjectIds } })
        .lean(),
      this.activityModel
        .find({ _id: { $in: activityObjectIds } })
        .select('name photo')
        .lean(),
    ]);

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
      staff: staffObjectId,
    }));

    const checkIn = await this.checkinModel.insertMany(docs);
    if (!checkIn || checkIn.length === 0) {
      throw new BadRequestException('Failed to create check-in records');
    }

    const activityNamesEn = activityDocs
      .map((a) => a.name?.en)
      .filter(Boolean)
      .join(', ');
    const activityNamesTh = activityDocs
      .map((a) => a.name?.th)
      .filter(Boolean)
      .join(', ');
    const activitiesImage = activityDocs.find((a) => a.photo?.bannerPhoto)
      ?.photo?.bannerPhoto;

    void this.notificationsService.create({
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

    const checkinsSse = this.sseService.sendToUser(userObjectId.toString(), {
      type: 'CHECKED_IN',
      data: {
        userId: userObjectId,
        staffId,
        activityIds: activities,
        activityNames: activityNamesEn,
      },
    });

    const activitiesSse = this.sseService.sendToUser(userObjectId.toString(), {
      type: 'REFETCH_DATA',
      path: '/activities/user',
    });
    Promise.all([checkinsSse, activitiesSse])
      .then(() => {
        Logger.log(
          `✅ Sent SSE: CHECKED_IN to user ${userObjectId.toString()} and REFETCH_DATA to staff ${userObjectId.toString()}`,
        );
      })
      .catch((err) => {
        Logger.error(
          `❌ Failed to send one or more SSE messages: ${err.message}`,
          err.stack,
        );
      });

    return checkIn;
  }

  async findAll(query: Record<string, string>) {
    return queryAll<Checkin>({
      model: this.checkinModel,
      query,
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'activity' }]),
    });
  }

  async findOne(
    id: string,
  ): Promise<{ data: Checkin[] | null; message: string }> {
    const result = await queryFindOne(this.checkinModel, { _id: id });
    return result;
  }

  async findAllByActivities(activityId: string) {
    const checkin = await this.checkinModel.find({ activity: new Types.ObjectId(activityId), })
      .populate('activity')
      .populate({
        path: 'user',
        select: ['username']
      })
    return checkin
  }
}