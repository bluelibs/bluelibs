import { CacheOptions } from "../cache/defs";
import { CACHE_SERVICE } from "../constants";
import * as Hash from "node-object-hash";
import { CACHE_CONFIG } from "..";

const Hasher = Hash({ sort: true, coerce: true });

const addUserBoundnessFieldsToKeyObject = (
  userBoundnessFields,
  objectBody,
  ctx
) => {
  userBoundnessFields.map((key) => (objectBody[key] = ctx[key]));
  return objectBody;
};

const calculateTtlWithExpirationBoundness = (options, ctx) => {
  let expirationTtl;
  if (typeof ctx[options.expirationBoundnessField] === "number")
    expirationTtl = ctx[options.expirationBoundnessField];
  else if (new Date(ctx[options.expirationBoundnessField])) {
    expirationTtl =
      new Date(ctx[options.expirationBoundnessField]).getTime() - Date.now();
  }
  if (!expirationTtl) return options.ttl;
  return Math.min(options.ttl, expirationTtl);
};

export function Cache<T>(
  options: CacheOptions,
  actions: ((_: any, args: any, ctx: any, ast: any) => Promise<any>)[]
) {
  return async function (_, args, ctx, ast) {
    options = {
      ...(await ctx.container.get(CACHE_CONFIG)),
      ...(options || {}),
    };
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
    if (options.userBoundness)
      keyBody = addUserBoundnessFieldsToKeyObject(
        options.userBoundnessFields,
        keyBody,
        ctx
      );
    if (options.expirationBoundness)
      options.ttl = calculateTtlWithExpirationBoundness(options, ctx);

    const cacheKey = Hasher.hash(keyBody);
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
