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
import { isCheckinAllowed, validateCheckinTime } from './utils/checkin.util';
import { queryAll } from 'src/pkg/helper/query.util';
import { Major, MajorDocument } from '../majors/schemas/major.schema';
import path from 'path';

@Injectable()
export class CheckinService {
  constructor(
    @InjectModel(Checkin.name) private checkinModel: Model<CheckinDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Activities.name)
    private activityModel: Model<ActivityDocument>,
    @InjectModel(Major.name) private majorModel: Model<MajorDocument>,
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

    return this.checkinModel.insertMany(docs) as unknown as Checkin[];
  }

  async findAll(query: Record<string, string>) {
    return await queryAll<Checkin>({
      model: this.checkinModel,
      query: {
        ...query,
      },
      filterSchema: {},
      populateFields: () =>
        Promise.resolve([
          {
            path: 'user',
            populate: [
              {
                path: 'metadata.major',
                model: 'Major',
                populate: { path: 'school' },
              },
              {
                path: 'role',
                model: 'Role',
              },
            ],
          },
          { path: 'staff' },
          { path: 'activity' },
        ]),
    });
  }

  async getCheckinCountByActivity() {
    // หาค่าไม่ซ้ำของ actvity จาก checkin
    const activityIds = await this.checkinModel.distinct('activity');
    const studentRole = await this.roleModel.findOne({
      name: { $in: ['student', 'Student'] },
    });
    const studentCount = await this.userModel.countDocuments({
      role: studentRole?._id,
    });

    // หากิจกรรมที่มี ID ตรงกับ activityIds แล้วดึงชื่อกิจกรรม
    const activities = await this.activityModel
      .find({ _id: { $in: activityIds } })
      .select('name type acronym')
      .populate('type', 'name')
      .lean();

    interface PopulatedUser {
      role?: { name: string };
    }

    const result = await Promise.all(
      activities.map(async (activity) => {
        const checkins = await this.checkinModel
          .find({ activity: activity._id })
          .populate({
            path: 'user',
            populate: { path: 'role', select: 'name' },
          })
          .lean();

        const studentCheckinCount = checkins.filter((c) =>
          ['student', 'Student'].includes(
            (c.user as PopulatedUser)?.role?.name || '',
          ),
        ).length;

        const internCheckinCount = checkins.filter((c) =>
          ['intern', 'Intern'].includes(
            (c.user as PopulatedUser)?.role?.name || '',
          ),
        ).length;

        const notCheckin = studentCount - studentCheckinCount;

        return {
          _id: activity._id,
          name: activity.name,
          acronym: activity.acronym,
          internCheckin: internCheckinCount,
          studentCheckin: studentCheckinCount,
          notCheckin: notCheckin,
        };
      }),
    );

    return result;
  }
}
