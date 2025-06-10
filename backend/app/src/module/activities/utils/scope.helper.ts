import { Types } from 'mongoose';
import { UserDocument } from 'src/module/users/schemas/user.schema';
import { toValidObjectIds } from 'src/pkg/libs/object-id.util';
import { ActivityDocument } from '../schemas/activities.schema';

export type ScopeInput = {
  major?: string | string[] | Types.ObjectId | Types.ObjectId[];
  school?: string | string[] | Types.ObjectId | Types.ObjectId[];
  user?: string | string[] | Types.ObjectId | Types.ObjectId[];
};

export type NormalizedScope = {
  major: Types.ObjectId[];
  school: Types.ObjectId[];
  user: Types.ObjectId[];
};

export function convertScopeToObjectIds(scope: ScopeInput): NormalizedScope {
  return {
    major: toValidObjectIds(scope.major),
    school: toValidObjectIds(scope.school),
    user: toValidObjectIds(scope.user),
  };
}

/**
 * Check if a user is within the scope of an activity.
 */
export function isUserInActivityScope(
  user: UserDocument,
  activity: ActivityDocument,
): boolean {
  const scope = activity.metadata?.scope;
  if (!scope) return true;

  const userId = user._id.toHexString();
  const majorId = extractObjectId(user.metadata?.major);
  let schoolId: string | undefined;
  const major = user.metadata?.major as { school?: { _id?: Types.ObjectId } };
  if (
    major &&
    typeof major === 'object' &&
    'school' in major &&
    major.school &&
    typeof major.school === 'object' &&
    '_id' in major.school &&
    major.school._id instanceof Types.ObjectId
  ) {
    schoolId = major.school._id.toHexString();
  }

  return (
    scope.user?.some(
      (id) =>
        (id instanceof Types.ObjectId
          ? id.toHexString()
          : typeof id === 'string'
            ? id
            : '') === userId,
    ) ||
    (!!majorId &&
      scope.major?.some(
        (id) =>
          (id instanceof Types.ObjectId
            ? id.toHexString()
            : typeof id === 'string'
              ? id
              : '') === majorId,
      )) ||
    (!!schoolId &&
      scope.school?.some(
        (id) =>
          (id instanceof Types.ObjectId
            ? id.toHexString()
            : typeof id === 'string'
              ? id
              : '') === schoolId,
      ))
  );
}

/**
 * Extracts _id from object or returns string directly.
 */
function extractObjectId(
  value: string | { _id?: Types.ObjectId } | undefined,
): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if ('_id' in value && value._id instanceof Types.ObjectId) {
    return value._id.toHexString();
  }
  return undefined;
}
