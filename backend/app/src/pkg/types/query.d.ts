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
  populateFields?: (excluded: string[]) => Promise<PopulateField[]>;
  chunkSize?: number;
  defaultLimit?: number;
}

export interface PopulateField {
  path: string;
  model?: string;
  select?: string | string[];
  populate?: PopulateField | PopulateField[];
}
