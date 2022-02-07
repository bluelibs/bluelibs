import { Inject, Service } from "@bluelibs/core";
import { CACHE_CONFIG } from "../constants";
import { CacheOptions } from "./defs";
import * as CacheManager from "cache-manager";

@Service()
export class CacheService {
  private cacheManager;
  private defaultTtl;
  private defaultRefresh;

  constructor(@Inject(CACHE_CONFIG) private config) {
    this.cacheManager = CacheManager.caching({
      store: this.config.store,
      ...this.config,
      ...this.config.storeConfig,
    });
    this.defaultRefresh = this.config.refresh;
    this.defaultTtl = this.config.ttl;
  }

  async set(key: string, data: any, options: CacheOptions) {
    await this.cacheManager.set(
      key,
      {
        data,
        syncedAt: Date.now(),
        ttl: options.ttl === undefined ? this.defaultTtl : options.ttl,
        refresh:
          options.refresh === undefined ? this.defaultRefresh : options.refresh,
      },
      { ttl: options.ttl === undefined ? this.defaultTtl : options.ttl }
    );
  }

  async get(key: string) {
    const cachedData = await this.cacheManager.get(key);
    if (!cachedData) return { found: false, data: undefined };
    else {
      if (cachedData && cachedData.refresh) {
        await this.set(key, cachedData.data, {
          ttl: cachedData.ttl,
          refresh: true,
        });
      }
      return { found: true, data: cachedData.data };
    }
  }
}
