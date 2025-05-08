import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model, FilterQuery, Types, Query } from 'mongoose';

/**
 * เช็กว่าข้อมูลซ้ำหรือไม่ → ถ้าซ้ำให้ throw
 */
export async function throwIfExists(
  model: Model<any>, // ✅ ใช้ any เพื่อหลีกเลี่ยง TS type mismatch
  filter: FilterQuery<any>,
  message = 'Data already exists'
): Promise<void> {
  const exists = await model.exists(filter);
  if (exists) {
    throw new BadRequestException(message);
  }
}

/**
 * หา document ตาม ID → ถ้าไม่เจอให้ throw
 */
export async function findOrThrow(
  input: Model<any> | Query<any, any>,
  id?: string | Types.ObjectId,
  name = 'Item'
): Promise<any> {
  let result: any;

  if (isQuery(input)) {
    result = await input.exec();
    id = id || result?._id?.toString?.() || 'unknown';
  } else if (isModel(input)) {
    result = await input.findById(id);
  } else {
    throw new Error('Invalid input passed to findOrThrow');
  }

  if (!result) {
    throw new NotFoundException(`${name} #${id} not found`);
  }

  return result;
}

function isModel(obj: any): obj is Model<any> {
  return typeof obj.findById === 'function';
}

function isQuery(obj: any): obj is Query<any, any> {
  return typeof obj.exec === 'function';
}
