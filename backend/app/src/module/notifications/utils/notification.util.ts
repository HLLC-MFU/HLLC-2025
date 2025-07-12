import { Model, Types } from "mongoose";
import { TargetDto } from "../dto/create-notification.dto";
import { ReceiversDto } from "../dto/push-notification.dto";
import { UserDocument } from "src/module/users/schemas/user.schema";
import { MajorDocument } from "src/module/majors/schemas/major.schema";

export function mapScopeToReceivers(
  scope: 'global' | TargetDto[],
): ReceiversDto | 'global' {
  if (scope === 'global') {
    return 'global';
  }

  const receivers: ReceiversDto = {};
  for (const target of scope) {
    if (target.type === 'school') {
      receivers.schools = [...(receivers.schools || []), ...target.id];
    } else if (target.type === 'major') {
      receivers.majors = [...(receivers.majors || []), ...target.id];
    } else if (target.type === 'user') {
      receivers.users = [...(receivers.users || []), ...target.id];
    }
  }

  return receivers;
}

export async function getUsersByRoles(
  userModel: Model<UserDocument>,
  roleIds: string[],
): Promise<Set<string>> {
  if (!roleIds.length) return new Set();
  const users = await userModel.find({
    role: { $in: roleIds.map(id => new Types.ObjectId(id)) },
  }).select('_id');
  return new Set(users.map(u => u._id.toString()));
}

export async function getUsersByMajors(
  userModel: Model<UserDocument>,
  majorIds: string[],
): Promise<Set<string>> {
  if (!majorIds.length) return new Set();
  const users = await userModel.find({
    'metadata.major': { $in: majorIds },
  }).select('_id');
  return new Set(users.map(u => u._id.toString()));
}

export async function getUsersBySchools(
  majorModel: Model<MajorDocument>,
  userModel: Model<UserDocument>,
  schoolIds: string[],
): Promise<Set<string>> {
  if (!schoolIds.length) return new Set();
  const matchedMajors = await majorModel.find({
    school: { $in: schoolIds.map(id => new Types.ObjectId(id)) },
  }).select('_id');

  if (!matchedMajors.length) return new Set();
  const majorIds = matchedMajors.map(m => m._id.toString());

  return getUsersByMajors(userModel, majorIds);
}