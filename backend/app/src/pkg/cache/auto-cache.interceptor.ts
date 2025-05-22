/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_KEY_METADATA, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { FastifyReply } from 'fastify';

@Injectable()
export class AutoCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AutoCacheInterceptor.name);
  private readonly memoryCache = new Map<
    string,
    { value: unknown; expiresAt: number }
  >();
  private readonly L1_TTL = 5000; // 5 seconds

  constructor(
    private reflector: Reflector,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.verbose('🚨 AutoCacheInterceptor CONSTRUCTED');
  }

  async intercept<T>(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Promise<Observable<T>> {
    const response = context.switchToHttp().getResponse<FastifyReply>();
    const request = context.switchToHttp().getRequest();
    const querySuffix = request.url.includes('?')
      ? `:${request.url.split('?')[1]}`
      : '';

    const rawKey =
      this.reflector.get<string>(CACHE_KEY_METADATA, context.getHandler()) ??
      this.reflector.get<string>(CACHE_KEY_METADATA, context.getClass());

    if (!rawKey) return next.handle();

    // ✅ Replace dynamic variables: $args[0], $params.id, $query.name
    const args: unknown[] = context.getArgs();
    const key =
      rawKey
        .replace(/\$args\[(\d+)\]/g, (_, i) => {
          const arg = args?.[+i];
          if (arg === undefined || arg === null) return '';
          if (typeof arg === 'string') return arg;
          if (typeof arg === 'number' || typeof arg === 'boolean')
            return arg.toString();
          try {
            return JSON.stringify(arg);
          } catch {
            return '';
          }
        })
        .replace(/\$params\.(\w+)/g, (_, k) => {
          const param = request.params?.[k];
          if (param === undefined || param === null) return '';
          if (typeof param === 'string') return param;
          if (typeof param === 'number' || typeof param === 'boolean')
            return param.toString();
          try {
            return JSON.stringify(param);
          } catch {
            return '';
          }
        })
        .replace(/\$query\.(\w+)/g, (_, k) => {
          const queryVal = request.query?.[k];
          if (queryVal === undefined || queryVal === null) return '';
          if (typeof queryVal === 'string') return queryVal;
          if (typeof queryVal === 'number' || typeof queryVal === 'boolean')
            return queryVal.toString();
          try {
            return JSON.stringify(queryVal);
          } catch {
            return '';
          }
        }) + querySuffix;

    const now = Date.now();

    // ✅ L1 check
    const l1 = this.memoryCache.get(key);
    if (l1 && l1.expiresAt > now) {
      this.logger.verbose(`✅ L1 HIT: ${key}`);
      response.header('x-cache', 'HIT:L1');
      return of(l1.value as T);
    }

    this.logger.verbose(`❌ CACHE MISS: ${key}`);

    // ✅ L2 fallback
    const fromRedis = await this.cacheManager.get<T>(key);
    if (fromRedis !== undefined && fromRedis !== null) {
      this.logger.verbose(`🪙 L2 HIT → restore L1: ${key}`);
      this.memoryCache.set(key, {
        value: fromRedis,
        expiresAt: now + this.L1_TTL,
      });
      response.header('x-cache', 'HIT:L2');
      return of(fromRedis);
    }

    response.header('x-cache', 'MISS');

    // ✅ Handle and cache response
    return next.handle().pipe(
      tap((responseData: T) => {
        const sanitized = JSON.parse(JSON.stringify(responseData)) as T;

        this.memoryCache.set(key, {
          value: sanitized,
          expiresAt: now + this.L1_TTL,
        });
        this.logger.verbose(`💾 L1 SET: ${key} (TTL ${this.L1_TTL / 1000}s)`);

        void this.cacheManager
          .set(key, sanitized, 0)
          .then(() => this.logger.log(`📦 L2 SET (permanent): ${key}`))
          .catch((err) => this.logger.error(`❌ L2 SET error: ${key}`, err));
      }),
    );
  }
}
