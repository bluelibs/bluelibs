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
    const storedset = this.cacheManager.set(
      key,
      {
        data,
        syncedAt: Date.now(),
        ttl: options.ttl === undefined ? this.defaultTtl : options.ttl,
        refresh:
          options.refresh === undefined ? this.defaultRefresh : options.refresh,
      },
      options.ttl > 0 ? options.ttl : this.defaultTtl
    );
    return storedset;
  }

  async get(key: string) {
    const cachedData = await this.cacheManager.get(key);
    if (!cachedData) return { found: false, data: undefined };
    console.log("this.defaultTtl", this.defaultTtl);
    console.log("this.defaultRefresh", this.defaultRefresh);
    console.log("cachedData.refresh", cachedData.refresh);
    console.log("cachedData.ttl", cachedData.ttl);
    console.log("cachedData.syncedAt", cachedData.syncedAt);
    console.log("cachedData.data", cachedData.data ? "kayna" : "makinach ");
    if (cachedData && cachedData.refresh) {
      this.set(key, cachedData.data, {
        ttl: cachedData.ttl,
        refresh: true,
      });
    }
    return { found: true, data: cachedData.data };
  }
}
