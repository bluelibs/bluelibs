import { CacheOptions } from "../cache/defs";
import { CACHE_SERVICE } from "../constants";
import * as Hash from "node-object-hash";
import { CACHE_CONFIG } from "..";

const Hasher = Hash({ sort: true, coerce: true });

export function Cache<T>(
  actions: ((_: any, args: any, ctx: any, ast: any) => Promise<any>)[],
  options?: CacheOptions
) {
  return async function (_, args, ctx, ast) {
    //configure right options between default and specifiq
    options = configureOptions(ctx, options);

    //generate cache key
    const cacheKey = generateCacheKey(options, ctx, ast);

    //fetch cache
    const cache = await ctx.container.get(CACHE_SERVICE);

    let result = await cache.get(cacheKey);

    if (result && result.found) return result.data;

    for (const action of actions) {
      result = await action(_, args, ctx, ast);
    }
    await cache.set(cacheKey, result, options);

    return result;
  };
}

export const configureOptions = (ctx, options?): CacheOptions => {
  options = {
    ...ctx.container.get(CACHE_CONFIG).resolverDefaultConfig,
    ...options,
  };
  if (options.expirationBoundness)
    options.ttl = calculateTtlWithExpirationBoundness(options, ctx);
  return options;
};

export const generateCacheKey = (ctx, ast, options?: CacheOptions): string => {
  let keyBody: any = (({
    fieldName,
    fieldNodes,
    returnType,
    parentType,
    variableValues,
  }) => ({
    fieldName,
    fieldNodes,
    returnType,
    parentType,
    variableValues,
  }))(ast);
  if (options && options.userBoundness)
    keyBody = addUserBoundnessFieldsToKeyObject(
      options.userBoundnessFields,
      keyBody,
      ctx
    );

  return Hasher.hash(keyBody);
};

export const calculateTtlWithExpirationBoundness = (
  options: CacheOptions,
  ctx
): number => {
  let expirationTtl;
  if (typeof ctx[options.expirationBoundnessField] === "number")
    expirationTtl = ctx[options.expirationBoundnessField];
  else if (ctx[options.expirationBoundnessField] instanceof Date) {
    expirationTtl =
      (new Date(ctx[options.expirationBoundnessField]).getTime() - Date.now()) /
      1000;
  }
  if (!expirationTtl) return options.ttl;
  return Math.min(options.ttl, expirationTtl);
};

export const addUserBoundnessFieldsToKeyObject = (
  userBoundnessFields: string[],
  objectBody,
  ctx
) => {
  userBoundnessFields.map((key) => (objectBody[key] = ctx[key]));
  return objectBody;
};
