import { Types } from 'mongoose';
import { UserDocument } from '../../users/schemas/user.schema';
import { ActivityDocument } from '../schemas/activities.schema';
/**
 * Interface สำหรับข้อมูล Scope ที่รับเข้ามา
 * ค่าในอาร์เรย์อาจเป็น string หรือ ObjectId
 */
export interface ScopeInput {
  major?: (string | Types.ObjectId)[];
  school?: (string | Types.ObjectId)[];
  user?: (string | Types.ObjectId)[];
}

/**
 * Interface สำหรับข้อมูล Scope ที่ผ่านการตรวจสอบแล้ว
 * ค่าในอาร์เรย์จะเป็น ObjectId ทั้งหมด
 */
export interface ScopeOutput {
  major: Types.ObjectId[];
  school: Types.ObjectId[];
  user: Types.ObjectId[];
}

/**
 * วิเคราะห์และแปลงข้อมูล Scope ที่รับเข้ามาให้เป็น `Types.ObjectId`
 * โดยฟังก์ชันจะกรองค่าที่ไม่ถูกต้อง, null, หรือค่าว่างออกไป
 *
 * @param scope - อ็อบเจกต์ดิบที่อาจมี ID ในรูปแบบต่างๆ ปะปนกันมา
 * @returns อ็อบเจกต์ใหม่ที่ประกอบด้วยอาร์เรย์ของ `ObjectId` ที่ถูกต้อง
 */
export function parseScope(scope: ScopeInput = {}): ScopeOutput {
  /**
   * ฟังก์ชันภายในสำหรับวิเคราะห์และแปลงอาร์เรย์ของ ID
   */
  const parseIdArray = (
    list?: (string | Types.ObjectId)[],
  ): Types.ObjectId[] => {
    if (!Array.isArray(list)) {
      return [];
    }

    return list
      .map((id) => id?.toString().trim())
      .filter((id): id is string => Boolean(id && Types.ObjectId.isValid(id)))
      .map((id) => new Types.ObjectId(id));
  };

  return {
    major: parseIdArray(scope.major),
    school: parseIdArray(scope.school),
    user: parseIdArray(scope.user),
  };
}

/**
 * วิเคราะห์และแปลงข้อมูลนำเข้า (string, string[], or null)
 * ให้กลายเป็นอาร์เรย์ของสตริงที่สะอาด
 * - หากเป็น string จะแยกด้วย comma, ตัดช่องว่าง, และกรองค่าว่างออก
 * - หากเป็น array อยู่แล้ว จะส่งคืนค่าเดิม
 * - หากเป็น null หรือค่าว่าง จะคืนค่าอาร์เรย์ว่าง
 *
 * @param value - ข้อมูลที่ต้องการแปลง
 * @returns อาร์เรย์ของสตริง
 */
export function parseStringArray(value: string | string[] | null): string[] {
  // 1. Guard Clause: จัดการกรณีที่เป็น null, undefined, หรือค่าที่ไม่ใช่ string/array
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return [];
  }

  // 2. Processing Chain: เมื่อมั่นใจว่าเป็น string แล้ว จะเข้าสู่กระบวนการแปลง
  return value
    .split(',') // แยกสตริงด้วย comma (ถ้าไม่มี comma จะได้อาร์เรย์ที่มี 1 item)
    .map((item) => item.trim()) // ตัดช่องว่างหน้า-หลังของทุกส่วน
    .filter(Boolean); // กรองค่าว่างออก (เช่น กรณี "a,,b" หรือสตริงว่าง)
}

/**
 * ตรวจสอบว่าผู้ใช้อยู่ในขอบเขต (Scope) ของกิจกรรมหรือไม่
 * @param user - อ็อบเจกต์ของผู้ใช้
 * @param activity - อ็อบเจกต์ของกิจกรรม
 * @returns `true` หากผู้ใช้อยู่ในขอบเขต, มิฉะนั้น `false`
 */
export function isUserInScope(
  user: UserDocument,
  activity: ActivityDocument,
): boolean {
  const scope = activity.metadata?.scope;

  if (!scope) {
    return true;
  }

  const userId = user._id?.toString();
  const majorId =
    typeof user.metadata?.major === 'object' &&
    user.metadata?.major !== null &&
    '_id' in user.metadata.major
      ? (
          user.metadata.major as { _id?: Types.ObjectId | string }
        )._id?.toString()
      : undefined;
  const schoolId =
    typeof user.metadata?.major === 'object' &&
    user.metadata?.major !== null &&
    'school' in user.metadata.major &&
    typeof (user.metadata.major as { school?: unknown }).school === 'object' &&
    (user.metadata.major as { school?: unknown }).school !== null &&
    '_id' in ((user.metadata.major as { school?: unknown }).school as object)
      ? (
          user.metadata.major as { school?: { _id?: Types.ObjectId | string } }
        ).school?._id?.toString()
      : undefined;

  const isEmptyScope =
    (!scope.user || scope.user.length === 0) &&
    (!scope.major || scope.major.length === 0) &&
    (!scope.school || scope.school.length === 0);

  if (isEmptyScope) {
    return true;
  }

  const isInUserScope = scope.user?.some((id) => {
    if (typeof id === 'string' || id instanceof Types.ObjectId) {
      return id.toString() === userId;
    }
    return false;
  });

  const isInMajorScope =
    !!majorId &&
    scope.major?.some(
      (id) =>
        (typeof id === 'string' || id instanceof Types.ObjectId) &&
        id.toString() === majorId,
    );

  const isInSchoolScope =
    !!schoolId &&
    scope.school?.some(
      (id) =>
        (typeof id === 'string' || id instanceof Types.ObjectId) &&
        id.toString() === schoolId,
    );

  return !!(isInUserScope || isInMajorScope || isInSchoolScope);
}
