const LRU = require("tiny-lru");
import { compileQuery, isCompiledQuery } from "graphql-jit";

export function jitSchemaExecutor(
  schema: any,
  cacheSize = 1024,
  compilerOpts: any = {}
) {
  const cache = LRU(cacheSize);
  return async ({
    context,
    document,
    operationName,
    request,
    queryHash,
  }: {
    context: any;
    document: any;
    operationName: string;
    request: any;
    queryHash: string;
  }) => {
    const prefix = operationName || "NotParametrized";
    const cacheKey = `${prefix}-${queryHash}`;
    let compiledQuery = cache.get(cacheKey);
    if (!compiledQuery) {
      const compilationResult = compileQuery(
        schema,
        document,
        operationName || undefined,
        compilerOpts
      );
      if (isCompiledQuery(compilationResult)) {
        compiledQuery = compilationResult;
        cache.set(cacheKey, compiledQuery);
      } else {
        // ...is ExecutionResult
        return compilationResult;
      }
    }
    return compiledQuery.query(undefined, context, request.variables || {});
  };
}
