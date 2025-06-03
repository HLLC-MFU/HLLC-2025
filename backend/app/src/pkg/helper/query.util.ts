import {
  Model,
  HydratedDocument,
  SortOrder,
  UpdateQuery,
  FilterQuery,
  QueryOptions,
} from 'mongoose';
import { PaginatedResponse } from '../interceptors/response.interceptor';
import {
  FieldType,
  QueryPaginationOptions,
  PopulateField,
} from '../types/query';
import { NotFoundException } from '@nestjs/common';
import { PopulateOptions } from 'mongoose';

function parseSort(sortString?: string): Record<string, SortOrder> {
  if (!sortString) return {};
  return sortString
    .split(',')
    .reduce<Record<string, SortOrder>>((acc, field) => {
      const key = field.startsWith('-') ? field.slice(1) : field;
      acc[key] = field.startsWith('-') ? -1 : 1;
      return acc;
    }, {});
}

function parseFilters<T>(
  raw: Record<string, string>,
  schema: Record<string, FieldType> = {},
): Record<keyof T | string, string | number | boolean> {
  const filters: Record<string, string | number | boolean> = {};
  for (const key in raw) {
    const val = raw[key];
    if (!val) continue;

    switch (schema[key]) {
      case 'boolean':
        filters[key] = val === 'true';
        break;
      case 'number':
        filters[key] = Number(val);
        break;
      default:
        filters[key] = val;
    }
  }
  return filters as Record<keyof T | string, string | number | boolean>;
}

function buildPopulateWithExcludes(
  rawPopulate: PopulateOptions[],
  excludedNestedFields: string[],
): PopulateOptions[] {
  return rawPopulate.map((p) => {
    const nestedExcludes = excludedNestedFields
      .filter((f) => f.startsWith(`${p.path}.`))
      .map((f) => f.slice(p.path.length + 1));

    if (p.populate) {
      const nestedPopulate = Array.isArray(p.populate)
        ? p.populate
        : [p.populate];
      const filteredNestedPopulate = nestedPopulate.filter(
        (item): item is PopulateOptions =>
          typeof item === 'object' && item !== null,
      );
      p.populate = buildPopulateWithExcludes(
        filteredNestedPopulate,
        nestedExcludes,
      );
    }

    const nestedSelects = nestedExcludes.map((f) => `-${f}`).join(' ');
    const baseSelect = p.select ? `${p.select} -__v` : '-__v';
    p.select = nestedSelects ? `${baseSelect} ${nestedSelects}` : baseSelect;

    return p;
  });
}

async function getLastUpdatedAt<T>(
  model: Model<HydratedDocument<T>>,
): Promise<string> {
  const latest = await model
    .findOne()
    .sort({ updatedAt: -1 })
    .select('updatedAt')
    .lean<{ updatedAt?: Date }>()
    .exec();

  return latest?.updatedAt instanceof Date
    ? latest.updatedAt.toISOString()
    : new Date().toISOString();
}

/**
 *
 * @param options
 * @returns
 */
export async function queryAll<T>(
  options: QueryPaginationOptions<T>,
): Promise<PaginatedResponse<T> & { message: string }> {
  const {
    model,  
    query = {},
    filterSchema,
    populateFields,
    chunkSize = 1000,
    defaultLimit = 20,
    select,
  } = options;

  const { page = '1', limit, sort, excluded = '', ...rawFilters } = query;
  const pageNum = Math.max(parseInt(page, 10), 1);
  const limitNum = limit ? parseInt(limit, 10) : defaultLimit;
  const excludedFields = ['__v', ...excluded.split(',').filter(Boolean)];
  const excludeSelect = excludedFields.map((f) => `-${f}`).join(' ');

  const filters = parseFilters<T>(
    rawFilters,
    filterSchema,
  ) as import('mongoose').RootFilterQuery<T>;
  const sortBy = parseSort(sort);

  let populate: any[] = [];
  if (populateFields) {
    const rawPopulate = await populateFields(excludedFields);
    populate = buildPopulateWithExcludes(rawPopulate, excludedFields); // 👈 ใช้ helper recursive
  }

  const totalPromise = model.countDocuments(filters);
  const lastUpdatedAtPromise = getLastUpdatedAt(model);
  if (limitNum === 0) {
    const total = await totalPromise;
    const batchCount = Math.ceil(total / chunkSize);

    const allBatchPromises = Array.from({ length: batchCount }, (_, i) =>
      model
        .find(filters)
        .select(excludeSelect)
        .skip(i * chunkSize)
        .limit(chunkSize)
        .sort(sortBy)
        .populate(populate)
        .lean(),
    );

    const allBatches = await Promise.all(allBatchPromises);
    const allData = allBatches.flat();

    return {
      data: allData as T[],
      meta: {
        total,
        page: 1,
        limit: total,
        totalPages: 1,
        lastUpdatedAt: await lastUpdatedAtPromise,
      },
      message: `${model.modelName} fetched successfully`,
    };
  }

  const skip = (pageNum - 1) * limitNum;
  const dataPromise = model
    .find(filters)
    .select(excludeSelect)
    .skip(skip)
    .limit(limitNum)
    .sort(sortBy)
    .populate(populate)
    .lean();

  const [total, data, lastUpdatedAt] = await Promise.all([
    totalPromise,
    dataPromise,
    lastUpdatedAtPromise,
  ]);

  return {
    data: data as T[],
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      lastUpdatedAt,
    },
    message: `${model.modelName} fetched successfully`,
  };
}

/**
 *
 * @param query
 * @returns
 * example: this.usersService.findOneByQuery({ username });
 */
export async function queryFindOne<T>(
  model: Model<HydratedDocument<T>>,
  filter: FilterQuery<T>,
  populateFields?: PopulateField[],
): Promise<{ data: T[]; message: string }> {
  // <- note: data is plain T[]
  const query = model.findOne(filter);
  populateFields?.forEach((p) => {
    query.populate(p);
  });

  const result = await query.lean({ virtuals: true });

  if (!result) {
    throw new NotFoundException(
      `${filter._id ?? JSON.stringify(filter)} not found`,
    );
  }

  const modelName = model.modelName ?? 'Document';
  return {
    data: [result as T], // no .toObject() needed, already plain
    message: `${modelName} fetched successfully`,
  };
}

export async function queryUpdateOne<T>(
  model: Model<HydratedDocument<T>>,
  id: string,
  update: UpdateQuery<HydratedDocument<T>>,
): Promise<T> {
  const updated = await model
    .findByIdAndUpdate(id, update, { new: true })
    .lean();
  if (!updated) {
    throw new NotFoundException(`Update failed, id ${id} not found`);
  }
  return updated as T;
}

/**
 *
 * @param {Model<HydratedDocument<T>>} model - Mongoose model to query.
 * @param {FilterQuery<T>} filter - Filter condition to find the document.
 * @param {UpdateQuery<HydratedDocument<T>>} update - Update query for the document.
 * @param {QueryOptions} [options={}] - Additional Mongoose update options (e.g., upsert, projection, runValidators).
 * @returns {Promise<T>} - Updated document as a plain JavaScript object (lean).
 * @example
 * const updated = await queryUpdateOneByFilter<User>(
 *   this.userModel,
 *   { email: 'test@example.com' },
 *   { $set: { name: 'Updated' } },
 *   { upsert: true, runValidators: true }
 * );
 */
export async function queryUpdateOneByFilter<T>(
  model: Model<HydratedDocument<T>>,
  filter: FilterQuery<T>,
  update: UpdateQuery<HydratedDocument<T>>,
  options: QueryOptions = {},
): Promise<T> {
  const updated = await model
    .findOneAndUpdate(filter, update, {
      new: true,
      ...options,
    })
    .lean();

  if (!updated) {
    throw new NotFoundException(
      `Update failed, filter: ${JSON.stringify(filter)} not found`,
    );
  }

  return updated as T;
}

export async function queryDeleteOne<T>(
  model: Model<HydratedDocument<T>>,
  id: string,
): Promise<T> {
  const deleted = await model.findByIdAndDelete(id).lean();
  if (!deleted) {
    throw new NotFoundException(`Delete failed, id ${id} not found`);
  }
  return deleted as T;
}
