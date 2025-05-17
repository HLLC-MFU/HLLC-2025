// 📁 src/common/helpers/buildPaginatedResponse.ts

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  lastUpdatedAt?: string;
  [key: string]: any;
}

export interface BaseResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta: PaginatedMeta;
}

export function buildPaginatedResponse<T>(
  data: T[],
  meta: PaginatedMeta,
  message = 'Success',
): BaseResponse<T[]> {
  return {
    success: true,
    message,
    data,
    meta,
  };
}
