// src/common/checkin.util.ts
import { BadRequestException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Role } from 'src/module/role/schemas/role.schema';
import { User } from 'src/module/users/schemas/user.schema';
import { Activities } from 'src/module/activities/schemas/activities.schema';

export async function validateCheckinTime(
  activityIds: string[],
  activityModel: Model<Activities>,
): Promise<void> {
  const now = new Date();

  const activities = await activityModel
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

export async function isCheckinAllowed(
  staffId: string,
  userId: string,
  userModel: Model<User>,
  roleModel: Model<Role>,
): Promise<boolean> {
  type RoleWithMetadata = Role & {
    _id: Types.ObjectId;
    metadata?: { canCheckin?: { user?: string[] } };
  };

  const [staff, user] = await Promise.all([
    userModel
      .findById(staffId)
      .populate({
        path: 'role',
        select: 'metadata.canCheckin',
        model: roleModel,
      })
      .lean<{ role?: RoleWithMetadata }>(),

    userModel
      .findById(userId)
      .populate({
        path: 'role',
        select: '_id',
        model: roleModel,
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
