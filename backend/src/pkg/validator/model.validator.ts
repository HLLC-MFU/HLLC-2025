import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model, FilterQuery, Types, HydratedDocument } from 'mongoose';

/**
 * เช็กว่าข้อมูลซ้ำหรือไม่ → ถ้าซ้ำให้ throw
 */
export async function throwIfExists<T>(
  model: Model<HydratedDocument<T>>,
  filter: FilterQuery<HydratedDocument<T>>,
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
export async function findOrThrow<T>(
  model: Model<HydratedDocument<T>>,
  idOrFilter: string | Types.ObjectId | FilterQuery<HydratedDocument<T>>,
  name = 'Item',
): Promise<HydratedDocument<T>> {
  let doc: HydratedDocument<T> | null = null;

  if (typeof idOrFilter === 'string' || idOrFilter instanceof Types.ObjectId) {
    doc = await model.findById(idOrFilter).exec();
  } else {
    doc = await model.findOne(idOrFilter).exec();
  }

  if (!doc) {
    throw new NotFoundException(`${name} not found`);
  }

  return doc;
}
