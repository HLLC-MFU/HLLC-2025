import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { FastifyReply } from 'fastify';

interface ApiResponse<T> {
  data: T;
  statusCode: number;
  message: string | null;
}

@Injectable()
export class TransformInterceptor<T extends Record<string, unknown>>
  implements NestInterceptor<T, ApiResponse<Omit<T, 'message'>>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<Omit<T, 'message'>>> {
    return next.handle().pipe(
      map((data: T): ApiResponse<Omit<T, 'message'>> => {
        const response = context.switchToHttp().getResponse<FastifyReply>();
        const statusCode = response.statusCode;

        const { message, ...rest } = data ?? ({} as T);

        return {
          data: rest,
          statusCode,
          message: typeof message === 'string' ? message : null,
        };
      }),
    );
  }
}
