import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

export class CacheMiddleware {
  private cache: NodeCache;
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly COLLECTION_TTL = 600; // 10 minutes
  private readonly HISTORY_TTL = 3600; // 1 hour

  constructor() {
    this.cache = new NodeCache({
      stdTTL: this.DEFAULT_TTL,
      checkperiod: 120,
      useClones: false
    });
  }

  public checkCache = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cacheKey = this.generateCacheKey(req);
      const cachedData = this.cache.get(cacheKey);

      if (cachedData) {
        res.json(cachedData);
        return;
      }

      // Attach cache methods to response object
      res.locals.cache = {
        set: (data: any) => this.setCacheData(cacheKey, data, req)
      };

      next();
    } catch (error) {
      next(error); // Pass errors to error handling middleware
    }
  };

  private generateCacheKey(req: Request): string {
    const { path, query, params } = req;
    return JSON.stringify({
      path,
      query,
      params
    });
  }

  private setCacheData(key: string, data: any, req: Request): void {
    const ttl = this.determineTTL(req.path);
    this.cache.set(key, data, ttl);
  }

  private determineTTL(path: string): number {
    if (path.includes('/collection/')) {
      return this.COLLECTION_TTL;
    }
    if (path.includes('/history/')) {
      return this.HISTORY_TTL;
    }
    return this.DEFAULT_TTL;
  }

  public clearCache(pattern: string): void {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    matchingKeys.forEach(key => this.cache.del(key));
  }

  public getCacheStats(): object {
    return {
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      keys: this.cache.keys().length
    };
  }
}