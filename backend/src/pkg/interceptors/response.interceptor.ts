import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Model, Document, FilterQuery } from 'mongoose';
import type { FastifyRequest as Request } from 'fastify';

interface PopulateField {
  path: string;
  model?: string;
}

interface Meta {
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

export interface ResponseInterceptorRequest<T extends Document>
  extends Request {
  model?: Model<T>;
  filters?: FilterQuery<T>;
  populateFields?: PopulateField[];
  query: {
    page?: string;
    limit?: string;
    [key: string]: string | undefined;
  };
}

@Injectable()
export class ResponseInterceptor<T extends Document>
  implements NestInterceptor
{
  private readonly CHUNK_SIZE = 1000;
  private readonly DEFAULT_LIMIT = 20;
  private readonly MAX_LIMIT = 10000;

  intercept(
    context: ExecutionContext,
    next: CallHandler<PaginatedResponse<T>>,
  ): Observable<PaginatedResponse<T>> {
    const req = context
      .switchToHttp()
      .getRequest<ResponseInterceptorRequest<T>>();

    let page = parseInt(req.query.page ?? '1', 10);
    let limit = parseInt(req.query.limit ?? `${this.DEFAULT_LIMIT}`, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 0) limit = 0;
    if (limit > this.MAX_LIMIT) limit = this.MAX_LIMIT;

    req.query.page = String(page);
    req.query.limit = String(limit);

    return next.handle().pipe(
      mergeMap(async (result): Promise<PaginatedResponse<T>> => {
        const model = req.model;
        const filters = req.filters ?? {};
        const populateFields = req.populateFields ?? [];

        if (!model || !Array.isArray(result.data) || !result.meta) {
          return result;
        }

        // ✅ If limit = 0 → fetch all chunks
        if (limit === 0) {
          const total = await model.countDocuments(filters);
          const totalChunks = Math.ceil(total / this.CHUNK_SIZE);
          const allData: T[] = [];

          for (let i = 0; i < totalChunks; i++) {
            const chunkQuery = model
              .find(filters)
              .skip(i * this.CHUNK_SIZE)
              .limit(this.CHUNK_SIZE);

            for (const field of populateFields) {
              chunkQuery.populate(field); // ✅ no error, no misuse
            }

            const chunk = (await chunkQuery.lean().exec()) as T[];
            allData.push(...chunk);
          }

          const latest = await model
            .findOne()
            .sort({ updatedAt: -1 })
            .select('updatedAt')
            .lean()
            .exec();

          const lastUpdatedAt =
            latest && 'updatedAt' in latest && latest.updatedAt
              ? (latest.updatedAt as Date).toISOString()
              : new Date().toISOString();

          return {
            data: allData,
            meta: {
              total,
              page: 1,
              limit: total,
              totalPages: 1,
              lastUpdatedAt,
            },
          };
        }

        return result;
      }),
    );
  }
}
