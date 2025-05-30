import {
  Model,
  HydratedDocument,
  SortOrder,
  UpdateQuery,
  FilterQuery,
} from 'mongoose';
import { PaginatedResponse } from '../interceptors/response.interceptor';
import {
  FieldType,
  QueryPaginationOptions,
  PopulateField,
} from '../types/query';
import { NotFoundException } from '@nestjs/common';

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

export async function queryAll<T>(
  options: QueryPaginationOptions<T>,
): Promise<PaginatedResponse<T> & { message: string }> {
  const {
    model,
    query = {},
    filterSchema,
    buildPopulateFields,
    chunkSize = 1000,
    defaultLimit = 20,
  } = options;

  const { page = '1', limit, sort, excluded = '', ...rawFilters } = query;

  const modelName = model.modelName || 'Document';
  const pageNum = Math.max(parseInt(page, 10), 1);
  const limitNum = limit ? parseInt(limit, 10) : defaultLimit;
  const excludedList = excluded ? excluded.split(',').filter(Boolean) : [];

  const filters = parseFilters<T>(
    rawFilters,
    filterSchema,
  ) as import('mongoose').RootFilterQuery<T>;
  const sortFields = parseSort(sort);
  const populateFields = buildPopulateFields
    ? await buildPopulateFields(excludedList)
    : [];

  const countPromise = model.countDocuments(filters);
  const lastUpdatedAtPromise = getLastUpdatedAt(model);

  if (limitNum === 0) {
    const total = await countPromise;
    const totalChunks = Math.ceil(total / chunkSize);
    const chunkQueries = Array.from({ length: totalChunks }, (_, i) =>
      model
        .find(filters)
        .skip(i * chunkSize)
        .limit(chunkSize)
        .sort(sortFields)
        .populate(populateFields)
        .lean(),
    );

    const chunks = await Promise.all(chunkQueries);
    const allData = chunks.flat();

    return {
      data: allData as T[],
      meta: {
        total,
        page: 1,
        limit: total,
        totalPages: 1,
        lastUpdatedAt: await lastUpdatedAtPromise,
      },
      message: `${modelName} fetched successfully`,
    };
  }

  const skip = (pageNum - 1) * limitNum;

  const dataPromise = model
    .find(filters)
    .skip(skip)
    .limit(limitNum)
    .sort(sortFields)
    .populate(populateFields)
    .lean();

  const [total, data, lastUpdatedAt] = await Promise.all([
    countPromise,
    dataPromise,
    lastUpdatedAtPromise,
  ]);

  const totalPages = Math.ceil(total / limitNum);

  return {
    data: data as T[],
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      lastUpdatedAt,
    },
    message: `${modelName} fetched successfully`,
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
