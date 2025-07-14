import { BadRequestException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from 'src/module/role/schemas/role.schema';
import { UserDocument } from 'src/module/users/schemas/user.schema';
import { ActivityDocument } from 'src/module/activities/schemas/activities.schema';
import { MajorDocument } from 'src/module/majors/schemas/major.schema';

export async function validateCheckinTime(
  activityIds: string[],
  activityModel: Model<ActivityDocument>,
  isAdmin: boolean,
): Promise<void> {
  if (isAdmin) {
    return;
  }
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
  userModel: Model<UserDocument>,
  roleModel: Model<RoleDocument>,
  majorModel: Model<MajorDocument>,
): Promise<boolean> {
  type RoleWithMetadata = Role & {
    _id: Types.ObjectId;
    metadata?: {
      canCheckin?: {
        user?: string[];
        school?: string[];
        major?: string[];
      };
    };
    permissions?: string[];
  };

  const [staff, user] = await Promise.all([
    userModel
      .findById(staffId)
      .populate({ path: 'role', select: 'metadata.canCheckin permissions', model: roleModel })
      .lean<{ role?: RoleWithMetadata }>(),

    userModel
      .findById(userId)
      .populate({ path: 'role', select: '_id', model: roleModel })
      .lean<{ role?: Role & { _id: Types.ObjectId }; metadata?: any }>(),
  ]);

  // ถ้า role มี permissions = * ให้ผ่านเลย
  if (Array.isArray(staff?.role?.permissions) && staff.role.permissions.includes('*')) {
    return true;
  }

  const canCheckin = staff?.role?.metadata?.canCheckin;

  if (!canCheckin) {
    throw new BadRequestException('Staff or staff role is invalid');
  }

  const userRoleId = user?.role?._id?.toString();
  //By user role
  if (Array.isArray(canCheckin.user)) {
    if (!userRoleId) throw new BadRequestException('User role invalid');

    if (canCheckin.user.includes('*') || canCheckin.user.includes(userRoleId)) {
      return true;
    } 
  }
  //By major
  const userMajorId = user?.metadata?.major?._id ?? user?.metadata?.major;
  if (Array.isArray(canCheckin.major)) {
    if (canCheckin.major.includes('*')) {
      return true;
    }
    if (userMajorId && canCheckin.major.includes(userMajorId.toString())) {
      return true;
    }
  }

  //By school
  let userSchoolId: string | undefined = undefined;

  if (userMajorId) {
    const majorDoc = await majorModel.findById(userMajorId).populate('school').lean();
    userSchoolId = majorDoc?.school?._id?.toString();
  }

  if (Array.isArray(canCheckin.school)) {
    if (canCheckin.school.includes('*')) {
      return true;
    }
    if (userSchoolId && canCheckin.school.includes(userSchoolId)) {
      return true;
    }
  }
  throw new BadRequestException('User scope is not allowed by staff role');
}
