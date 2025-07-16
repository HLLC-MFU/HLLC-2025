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
import { SseService } from '../sse/sse.service';

@Injectable()
export class CheckinService {
  constructor(
    @InjectModel(Checkin.name) private checkinModel: Model<CheckinDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Activities.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(Major.name) private majorModel: Model<MajorDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly sseService: SseService,
  ) { }

  async create(createCheckinDto: CreateCheckinDto): Promise<Checkin[]> {
    const { staff: staffId, user: username, activities } = createCheckinDto;

    if (!username || typeof username !== 'string') {
      throw new BadRequestException('Invalid username');
    }

    // หา user ที่จะถูกเช็คอิน
    const userDoc = await this.userModel
      .findOne({ username })
      .select('_id role')
      .populate<{ role: RoleDocument }>('role');
    if (!userDoc) throw new BadRequestException('User not found');

    const userObjectId = userDoc._id;

    if (!userDoc.role || !userDoc.role.name) {
      throw new BadRequestException('Target user role not found');
    }
    const targetRole = userDoc.role.name.trim().toUpperCase();

    // staff ผู้เช็คอิน (คนยิง)
    if (!staffId) {
      throw new BadRequestException('Staff ID is required');
    }

    // เช็ค staffId ว่าถูกต้องก่อนแปลง
    if (!Types.ObjectId.isValid(staffId)) {
      throw new BadRequestException('Invalid staff ID');
    }
    const staffObjectId = new Types.ObjectId(staffId);

    const staffDoc = await this.userModel
      .findById(staffObjectId)
      .select('role')
      .populate<{ role: RoleDocument }>('role');
    if (!staffDoc || !staffDoc.role || !staffDoc.role.name) {
      throw new BadRequestException('Staff role not found');
    }
    const staffRole = staffDoc.role.name.trim().toUpperCase();

    // เช็ก policy ตามที่กำหนด
    if (staffRole === 'ADMINISTRATOR') {
      // admin ทำได้ทุกกรณี
    } else if (staffRole === 'STAFF') {
      if (targetRole === 'ADMINISTRATOR') {
        throw new BadRequestException('STAFF cannot check-in Administrator');
      }
    } else if (staffRole.startsWith('SMO')) {
      if (
        targetRole === 'ADMINISTRATOR' ||
        targetRole === 'STAFF' ||
        targetRole.startsWith('SMO')
      ) {
        throw new BadRequestException('SMO cannot check-in Administrator, STAFF or SMO');
      }
    } else {
      // Fresher หรือ role อื่น ๆ ห้ามเช็คอินใครเลย
      throw new BadRequestException('You are not allowed to check-in other users');
    }

    if (!Array.isArray(activities) || activities.length === 0) {
      throw new BadRequestException('Activities must be a non-empty array');
    }

    // ตรวจสอบเวลาที่อนุญาตเช็คอิน
    const isAdmin = staffRole === 'ADMINISTRATOR';
    await validateCheckinTime(activities, this.activityModel, isAdmin);

    const activityObjectIds = activities.map((id) => new Types.ObjectId(id));

    // เช็คว่า user คนนี้เช็คอินไปแล้วหรือยัง
    const existing = await this.checkinModel
      .find({
        user: userObjectId,
        activity: { $in: activityObjectIds },
      })
      .lean();

    const alreadyChecked = new Set(existing.map((e) => e.activity.toString()));
    const filtered = activityObjectIds.filter((id) => !alreadyChecked.has(id.toString()));

    if (filtered.length === 0) {
      throw new BadRequestException('User already checked in to all activities');
    }

    const docs = filtered.map((activityId) => ({
      user: userObjectId,
      activity: activityId,
      staff: staffObjectId,
    }));

    const checkIn = (await this.checkinModel.insertMany(docs)) as Checkin[];
    if (!checkIn) {
      throw new BadRequestException('Failed to create check-in records');
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

    const activitiesImage = activityDocs.find((a) => a.photo?.bannerPhoto)?.photo?.bannerPhoto;

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

    this.sseService.sendToUser(userDoc._id.toString() ,{
      type: 'CHECKED_IN',
      data: {
        userId: userDoc._id,
        staffId: staffId,
        activityIds: activities,
        activityNames: activityNamesEn,
      }
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