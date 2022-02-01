import { Store } from "cache-manager";

export type CacheStore = {/* prettier-ignore */} | Store | "memory";
export type ICacheManagerConfig = {
  store: CacheStore;
  storeConfig: StoreConfig;
  ttl: number; //seconds,
  isCacheableValue?: (value: any) => boolean;
  memory?: number;
  refreshThreshold: number;
  isGlobal?: boolean;
  userBoundness?: boolean;
  refresh?: boolean;
};
export type StoreConfig =
  | BasicStoreConfig
  | MemcachedStoreConfig
  | HazelcastStoreConfig
  | RedisStoreConfig
  | IoRedisStoreConfig
  | MongoDbStoreConfig
  | MongooseStoreConfig
  | FsHashStoreConfig
  | FsBinaryStoreConfig;

export type RedisStoreConfig = {
  host: string;
  port: number;
  auth_pass: string;
  db?: number;
  url?: string;
};
export type IoRedisStoreConfig = {
  host: string;
  port: number;
  password: string;
  db?: number;
  clusterConfig?: {
    nodes: { port: number; host: string }[];
    options: {
      maxRedirections: number;
    };
  };
};
export type MongoDbStoreConfig = {
  uri: string;
  options?: {
    collection?: string;
    compression?: boolean;
    poolSize?: number;
    autoReconnect?: boolean;
  };
};
export type MongooseStoreConfig = {
  mongoose: any;
  modelName?: string;
  modelOptions?: {
    collection: string; // mongodb collection name
    versionKey: boolean; // do not create __v field
  };
};
export type FsBinaryStoreConfig = {
  options?: {
    reviveBuffers: boolean;
    ttl: number;
    binaryAsStream: boolean;
    maxsize: number /* max size in bytes on disk */;
    path: string;
    preventfill: boolean;
  };
};
export type FsHashStoreConfig = {
  options?: {
    path: string; //path for cached files
    ttl: number; //time to life in seconds
    subdirs: boolean; //create subdirectories to reduce the
    //files in a single dir (default: false)
    zip: boolean;
  };
};
export type HazelcastStoreConfig = {
  defaultMap?: string; // Default Value is 'CACHE'
  host: string;
  port: string;
  prefix?: string;
  ttl: number;
};
export type MemcachedStoreConfig = {
  driver: any;
  options: {
    hosts: string[];
  };
};
export type BasicStoreConfig = {
  max: number;
};

export type CacheOptions = {
  ttl?: number;
  refresh?: boolean;
  userBoundness?: boolean;
  userBoundnessFields?: string[];
  expirationBoundness?: boolean;
  expirationBoundnessField?: string;
};
