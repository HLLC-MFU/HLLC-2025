import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateCheckinDto } from './dto/create-checkin.dto';
import { User } from 'src/module/users/schemas/user.schema';
import { Checkin } from './schema/checkin.schema';
import { Role } from '../role/schemas/role.schema';
import { Activities } from 'src/module/activities/schemas/activities.schema';

@Injectable()
export class CheckinService {
  constructor(
    @InjectModel(Checkin.name) private readonly checkinModel: Model<Checkin>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
    @InjectModel(Activities.name)
    private readonly activityModel: Model<Activities>,
  ) {}

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

      const isAllowed = await this.isCheckinAllowed(staffId, userId);
      if (!isAllowed) {
        throw new BadRequestException(
          'User is not allowed to be checked in by this staff',
        );
      }
    }

    await this.validateActivityTimeWindows(activities);

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

    return this.checkinModel.insertMany(docs) as unknown as Checkin[];
  }

  private async validateActivityTimeWindows(
    activityIds: string[],
  ): Promise<void> {
    const now = new Date();

    const activities = await this.activityModel
      .find({ _id: { $in: activityIds } })
      .select('name metadata.checkinStartAt metadata.endAt metadata.scope')
      .lean();

    for (const { name, metadata } of activities) {
      const checkinStart = metadata?.checkinStartAt
        ? new Date(metadata.checkinStartAt)
        : null;
      const checkinEnd = metadata?.endAt ? new Date(metadata.endAt) : null;
      const isBypassEndTime =
        Array.isArray(metadata?.scope?.user) &&
        metadata.scope.user.length === 1 &&
        typeof metadata.scope.user[0] === 'string' &&
        metadata.scope.user[0] === '*';

      if (checkinStart && now < checkinStart) {
        throw new BadRequestException(
          `Check-in time for activity "${name?.en || name?.th}" has not started yet.`,
        );
      }

      if (!isBypassEndTime && checkinEnd && now > checkinEnd) {
        throw new BadRequestException(
          `Check-in time for activity "${name?.en || name?.th}" has passed.`,
        );
      }
    }
  }

  async isCheckinAllowed(staffId: string, userId: string): Promise<boolean> {
    type RoleWithMetadata = Role & {
      _id: Types.ObjectId;
      metadata?: { canCheckin?: { user?: string[] } };
    };

    const [staff, user] = await Promise.all([
      this.userModel
        .findById(staffId)
        .populate({
          path: 'role',
          select: 'metadata.canCheckin',
          model: this.roleModel,
        })
        .lean<{ role?: RoleWithMetadata }>(),

      this.userModel
        .findById(userId)
        .populate({
          path: 'role',
          select: '_id',
          model: this.roleModel,
        })
        .lean<{ role?: Role & { _id: Types.ObjectId } }>(),
    ]);

    const allowedRoles = (staff?.role as RoleWithMetadata)?.metadata?.canCheckin
      ?.user;

    if (!Array.isArray(allowedRoles)) {
      throw new BadRequestException('Staff or staff role is invalid');
    }

    if (allowedRoles.includes('*')) return true;

    const userRoleId = user?.role?._id?.toString();
    if (!userRoleId) {
      throw new BadRequestException('User role is invalid');
    }

    return allowedRoles.map((id) => id.toString()).includes(userRoleId);
  }
}
