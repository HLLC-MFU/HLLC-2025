// src/shared/cache/middleware/cache-purge.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CachePurgeMiddleware implements NestMiddleware {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const methodsToPurge = ['POST', 'PUT', 'PATCH', 'DELETE'];
    const shouldClear = methodsToPurge.includes(req.method);

    if (shouldClear) {
      // Purge by pattern or manually hardcoded keys
      const relatedKeys = [`user:list`, `user:${req.params.id}`]; // 👈 Customize for your app
      for (const key of relatedKeys) {
        await this.cache.del(key);
      }
    }

    next();
  }
}
