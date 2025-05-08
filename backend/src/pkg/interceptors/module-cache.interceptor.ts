import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Reflector } from '@nestjs/core';
import { CacheStatsService } from '../cache/cache-stats.service';

export const CACHE_TTL = 'cache_ttl';
export const NO_CACHE = 'no_cache';
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL, ttl);
export const NoCache = () => SetMetadata(NO_CACHE, true);

@Injectable()
export class ModuleCacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
    private readonly cacheStatsService: CacheStatsService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    
    // Check if we should skip cache
    if (this.shouldSkipCache(context, request)) {
      return next.handle();
    }

    const cacheKey = this.buildCacheKey(request);
    const ttl = this.getTTL(context);
    const prefix = this.getCachePrefix(request);

    try {
      const startTime = Date.now();
      const cachedData = await this.cacheManager.get(cacheKey);
      const duration = Date.now() - startTime;
      
      if (cachedData) {
        // Track hit
        this.cacheStatsService.trackCacheHit(prefix, cacheKey, duration, cachedData);
        return of(cachedData);
      }

      // Track miss  
      this.cacheStatsService.trackCacheMiss(prefix, cacheKey, duration);

      return next.handle().pipe(
        tap(async (data) => {
          const setStartTime = Date.now();
          await this.cacheManager.set(cacheKey, data, ttl);
          const setDuration = Date.now() - setStartTime;
          
          // Track set
          this.cacheStatsService.trackCacheSet(prefix, cacheKey, setDuration, data);
        }),
      );
    } catch (error) {
      return next.handle();
    }
  }

  private shouldSkipCache(context: ExecutionContext, request: any): boolean {
    // Don't cache for POST, PUT, PATCH, DELETE
    if (!['GET'].includes(request.method)) {
      return true;
    }

    // Check for @NoCache() decorator
    const noCache = this.reflector.getAllAndOverride<boolean>(NO_CACHE, [
      context.getHandler(),
      context.getClass(),
    ]);

    return noCache === true;
  }

  private getTTL(context: ExecutionContext): number {
    const defaultTTL = 300; // 5 minutes
    const ttl = this.reflector.getAllAndOverride<number>(CACHE_TTL, [
      context.getHandler(),
      context.getClass(),
    ]);
    return ttl || defaultTTL;
  }

  private buildCacheKey(request: any): string {
    const { method, path, query, user } = request;
    const baseKey = `${method}:${path}`;
    
    // Include query parameters
    const queryString = Object.keys(query || {})
      .sort()
      .map(key => `${key}=${query[key]}`)
      .join('&');

    // Include user context (if any)
    const userContext = user ? `:user=${user._id}` : '';

    return `${baseKey}?${queryString}${userContext}`;
  }

  private getCachePrefix(request: any): string {
    // Extract the resource from the URL to use as prefix
    const parts = request.path.split('/').filter(Boolean);
    // Use the resource name as the prefix (e.g., 'users', 'schools', etc.)
    if (parts.length > 0) {
      return parts[parts.length - 1].split('?')[0]; // Remove query params
    }
    return 'module';
  }

  async invalidateCache(pattern: string): Promise<void> {
    try {
      const store = this.cacheManager.store as any;
      if (store && typeof store.keys === 'function') {
        const keys = await store.keys(pattern);
        
        if (keys && keys.length > 0) {
          const startTime = Date.now();
          for (const key of keys) {
            const delStartTime = Date.now();
            await this.cacheManager.del(key);
            const delDuration = Date.now() - delStartTime;
            this.cacheStatsService.trackCacheDel('module', key, delDuration);
          }
        }
      }
    } catch (error) {
      console.error(`Error invalidating cache: ${error.message}`);
    }
  }
} 