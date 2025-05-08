// pkg/interceptors/cache.interceptor.ts
import {
    Injectable,
    ExecutionContext,
    CallHandler,
    NestInterceptor,
    Logger,
  } from '@nestjs/common';
  import { HttpAdapterHost } from '@nestjs/core';
  import { Observable, of } from 'rxjs';
  import { tap } from 'rxjs/operators';
  import { CACHE_MANAGER } from '@nestjs/cache-manager';
  import { Inject } from '@nestjs/common';
  import { Cache } from 'cache-manager';
  import * as crypto from 'node:crypto';
  import { CacheStatsService } from '../cache/cache-stats.service';
  
  @Injectable()
  export class HttpCacheInterceptor implements NestInterceptor {
    private readonly logger = new Logger(HttpCacheInterceptor.name);
    
    constructor(
      @Inject(CACHE_MANAGER) private cacheManager: Cache,
      private readonly httpAdapterHost: HttpAdapterHost,
      private readonly cacheStatsService: CacheStatsService,
    ) {}
  
    async intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): Promise<Observable<any>> {
      const request = context.switchToHttp().getRequest();
      const { httpAdapter } = this.httpAdapterHost;
      
      // Cache only GET requests
      if (httpAdapter.getRequestMethod(request) !== 'GET') {
        return next.handle();
      }
  
      try {
        // Generate a unique cache key based on the full URL and query parameters
        const url = httpAdapter.getRequestUrl(request);
        const method = httpAdapter.getRequestMethod(request);
        const cacheKey = this.generateCacheKey(method, url, request.query);
        const prefix = this.getCachePrefix(url);
    
        this.logger.debug(`Checking cache for key: ${cacheKey}`);
    
        try {
          const startTime = Date.now();
          const cachedResponse = await this.cacheManager.get(cacheKey);
          const duration = Date.now() - startTime;
          
          if (cachedResponse) {
            // Track cache hit
            this.cacheStatsService.trackCacheHit(prefix, cacheKey, duration, cachedResponse);
            this.logger.debug(`Cache HIT: ${cacheKey} in ${duration}ms`);
            return of(cachedResponse);
          }
          
          // Track cache miss
          this.cacheStatsService.trackCacheMiss(prefix, cacheKey, duration);
          this.logger.debug(`Cache MISS: ${cacheKey} in ${duration}ms`);
    
          return next.handle().pipe(
            tap(async (response) => {
              // Cache the response
              const startSetTime = Date.now();
              await this.cacheManager.set(cacheKey, response);
              const setDuration = Date.now() - startSetTime;
              
              // Track cache set
              this.cacheStatsService.trackCacheSet(prefix, cacheKey, setDuration, response);
              this.logger.debug(`Cache SET: ${cacheKey} in ${setDuration}ms`);
            }),
          );
        } catch (error) {
          this.logger.error(`Cache Error: ${error.message}`, error.stack);
          return next.handle();
        }
      } catch (error) {
        this.logger.error(`Cache Interceptor Error: ${error.message}`, error.stack);
        return next.handle();
      }
    }
  
    private generateCacheKey(method: string, url: string, query: any): string {
      try {
        // Create a hash for the key to avoid length issues
        const rawKey = `${method}:${url}:${JSON.stringify(query || {})}`;
        return crypto.createHash('sha256').update(rawKey).digest('hex');
      } catch (error) {
        this.logger.error(`Error generating cache key: ${error.message}`, error.stack);
        // Return a simple fallback key if hashing fails
        return `${method}:${url}:fallback`;
      }
    }
  
    private getCachePrefix(url: string): string {
      // Extract the resource from the URL to use as prefix
      const parts = url.split('/').filter(Boolean);
      // Use the resource name as the prefix (e.g., 'users', 'schools', etc.)
      if (parts.length > 0) {
        return parts[parts.length - 1].split('?')[0]; // Remove query params
      }
      return 'general';
    }
  }
  