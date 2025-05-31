import { HydratedDocument, Model } from 'mongoose';

export type FieldType = 'string' | 'number' | 'boolean';

export interface PopulateField {
  path: string;
  model?: string;
  select?: string;
}

export interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  lastUpdatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: Meta;
}

export interface QueryPaginationOptions<T> {
  model: Model<HydratedDocument<T>>;
  query?: Record<string, string>;
  filterSchema?: Record<string, FieldType>;
  buildPopulateFields?: (excluded: string[]) => Promise<PopulateField[]>;
  chunkSize?: number;
  defaultLimit?: number;
  select?: string | string[] | Record<string, number | boolean | object>;
}

export interface PopulateField {
  path: string;
  model?: string;
  select?: string | string[];
  populate?: PopulateField | PopulateField[];
}
