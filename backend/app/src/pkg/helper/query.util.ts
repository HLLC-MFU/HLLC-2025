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
    select,
  } = options;

  const { page = '1', limit, sort, excluded = '', ...rawFilters } = query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = limit ? parseInt(limit, 10) : defaultLimit;
  const excludedList = excluded.split(',').filter(Boolean);

  const filters = parseFilters<T>(rawFilters, filterSchema);
  const sortFields = parseSort(sort);
  const populateFields = buildPopulateFields
    ? await buildPopulateFields(excludedList)
    : [];

  const total = await model.countDocuments(
    filters as import('mongoose').RootFilterQuery<T>,
  );
  const totalPages = limitNum > 0 ? Math.ceil(total / limitNum) : 1;

  if (limitNum === 0) {
    const totalChunks = Math.ceil(total / chunkSize);
    const allData: T[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const chunkQuery = model
        .find(filters as import('mongoose').RootFilterQuery<T>)
        .skip(i * chunkSize)
        .limit(chunkSize)
        .sort(sortFields);

      if (select) {
        chunkQuery.select(select);
      }

      populateFields.forEach((p) => {
        chunkQuery.populate(p);
      });

      const chunk = (await chunkQuery) as T[];
      allData.push(...chunk);
    }

    return {
      data: allData,
      meta: {
        total,
        page: 1,
        limit: total,
        totalPages: 1,
        lastUpdatedAt: await getLastUpdatedAt(model),
      },
      message: 'Data fetched successfully',
    };
  }

  const skip = (pageNum - 1) * limitNum;
  const queryBuilder = model
    .find(filters as import('mongoose').RootFilterQuery<T>)
    .skip(skip)
    .limit(limitNum)
    .sort(sortFields);

  if (select) {
    queryBuilder.select(select);
  }

  populateFields.forEach((p) => {
    queryBuilder.populate(p);
  });

  const [data, lastUpdatedAt] = await Promise.all([
    queryBuilder as Promise<T[]>,
    getLastUpdatedAt(model),
  ]);

  return {
    data,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      lastUpdatedAt,
    },
    message: 'Data fetched successfully',
  };
}

export async function queryFindOne<T>(
  model: Model<HydratedDocument<T>>,
  filter: FilterQuery<T>,
  populateFields?: PopulateField[],
): Promise<HydratedDocument<T>> {
  const query = model.findOne(filter);
  populateFields?.forEach((p) => {
    query.populate(p);
  });

  const result = await query;

  if (!result) {
    throw new NotFoundException(`${filter._id ?? JSON.stringify(filter)} not found`);
  }

  return result;
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
