import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model, FilterQuery, Types, Query, Document } from 'mongoose';

/**
 * เช็กว่าข้อมูลซ้ำหรือไม่ → ถ้าซ้ำให้ throw
 */
export async function throwIfExists<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  message = 'Data already exists',
): Promise<void> {
  const exists = await model.exists(filter);
  if (exists) {
    throw new BadRequestException(message);
  }
}

/**
 * หา document ตาม ID หรือ query → ถ้าไม่เจอให้ throw
 */
export async function findOrThrow<T extends Document>(
  input: Model<T> | Query<T | null, T>,
  id?: string | Types.ObjectId,
  name = 'Item',
): Promise<T> {
  let result: T | null;

  if (isQuery<T>(input)) {
    result = await input.exec();
    id = id || (result?._id?.toString?.() ?? 'unknown');
  } else if (isModel<T>(input)) {
    result = await input.findById(id).exec();
  } else {
    throw new Error('Invalid input passed to findOrThrow');
  }

  if (!result) {
    throw new NotFoundException(
      `${name} #${id?.toString() ?? 'unknown'} not found`,
    );
  }

  return result;
}

/**
 * Type Guard: ตรวจว่าเป็น Model หรือไม่
 */
function isModel<T>(obj: unknown): obj is Model<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Model<T>).findById === 'function'
  );
}

/**
 * Type Guard: ตรวจว่าเป็น Query หรือไม่
 */
function isQuery<T>(obj: unknown): obj is Query<T | null, T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Query<T | null, T>).exec === 'function'
  );
}
