/* eslint-disable @typescript-eslint/no-base-to-string */
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
  private readonly groupKeyMap = new Map<string, Set<string>>();
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
    const method = request.method?.toUpperCase();
    const querySuffix = request.url.includes('?')
      ? `:${request.url.split('?')[1]}`
      : '';

    const rawKey =
      this.reflector.get<string>(CACHE_KEY_METADATA, context.getHandler()) ??
      this.reflector.get<string>(CACHE_KEY_METADATA, context.getClass());

    if (!rawKey) return next.handle();

    // Generate actual cache key by replacing variables
    const args: unknown[] = context.getArgs();
    const key =
      rawKey
        .replace(/\$args\[(\d+)\]/g, (_, i) => {
          const arg = args?.[+i];
          return typeof arg === 'object'
            ? JSON.stringify(arg)
            : String(arg ?? '');
        })
        .replace(/\$params\.(\w+)/g, (_, k) => {
          const param = request.params?.[k];
          return typeof param === 'object'
            ? JSON.stringify(param)
            : String(param ?? '');
        })
        .replace(/\$query\.(\w+)/g, (_, k) => {
          const queryVal = request.query?.[k];
          return typeof queryVal === 'object'
            ? JSON.stringify(queryVal)
            : String(queryVal ?? '');
        }) + querySuffix;

    // Define group prefix from rawKey (e.g. users:xxx → users)
    const group = rawKey.split(':')[0];

    // 🧹 Invalidate cache group if not GET
    if (method !== 'GET') {
      this.logger.warn(`♻️ INVALIDATE CACHE GROUP: ${group} due to ${method}`);

      const groupKeys = this.groupKeyMap.get(group) ?? new Set();

      for (const k of groupKeys) {
        this.memoryCache.delete(k);
        void this.cacheManager.del(k).then(() => {
          this.logger.log(`🧹 Deleted cache [${group}] → ${k}`);
        });
      }

      this.groupKeyMap.delete(group); // Clear group tracking
      return next.handle(); // No caching on CUD
    }

    const now = Date.now();

    // 🔍 L1 Cache
    const l1 = this.memoryCache.get(key);
    if (l1 && l1.expiresAt > now) {
      this.logger.verbose(`✅ L1 HIT: ${key}`);
      response.header('x-cache', 'HIT:L1');
      return of(l1.value as T);
    }

    // 🔍 L2 Cache
    const fromRedis = await this.cacheManager.get<T>(key);
    if (fromRedis !== undefined && fromRedis !== null) {
      this.memoryCache.set(key, {
        value: fromRedis,
        expiresAt: now + this.L1_TTL,
      });
      this.groupKeyMap.set(group, this.groupKeyMap.get(group) ?? new Set());
      this.groupKeyMap.get(group)?.add(key);

      this.logger.verbose(`🪙 L2 HIT → L1 SET: ${key}`);
      response.header('x-cache', 'HIT:L2');
      return of(fromRedis);
    }

    // 🚫 MISS
    this.logger.verbose(`❌ CACHE MISS: ${key}`);
    response.header('x-cache', 'MISS');

    // ✅ Cache result
    return next.handle().pipe(
      tap((responseData: T) => {
        const sanitized = JSON.parse(JSON.stringify(responseData)) as T;

        this.memoryCache.set(key, {
          value: sanitized,
          expiresAt: now + this.L1_TTL,
        });

        // Track key in group
        this.groupKeyMap.set(group, this.groupKeyMap.get(group) ?? new Set());
        this.groupKeyMap.get(group)?.add(key);

        this.logger.verbose(`💾 L1 SET: ${key} (TTL ${this.L1_TTL / 1000}s)`);

        void this.cacheManager
          .set(key, sanitized, 0)
          .then(() => this.logger.log(`📦 L2 SET: ${key}`))
          .catch(err => this.logger.error(`❌ L2 SET error: ${key}`, err));
      }),
    );
  }
}
