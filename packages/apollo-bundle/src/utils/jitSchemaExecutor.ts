import { compileQuery, isCompiledQuery } from "graphql-jit";
import type { CompiledQuery, CompilerOptions } from "graphql-jit";
import LRU from "tiny-lru";

// `graphql-jit` is compiled against the real `graphql` typings, while this
// package resolves `graphql` to the ambient `@types/graphql` declaration,
// whose `GraphQLSchema`/`DocumentNode` kinds are string literals. The boundary
// is bridged with `unknown` + a single assertion into graphql-jit's own
// parameter types, keeping the drift contained to this module.
type CompiledSchema = Parameters<typeof compileQuery>[0];
type CompiledDocument = Parameters<typeof compileQuery>[1];
type CompiledOrResult = Parameters<typeof isCompiledQuery>[0];

type JITExecutorRequest = {
  context: unknown;
  document: unknown;
  operationName?: string;
  request: { variables?: Record<string, unknown> };
  queryHash: string;
};

export function jitSchemaExecutor(
  schema: unknown,
  cacheSize = 1024,
  compilerOpts: Partial<CompilerOptions> = {}
) {
  const cache = LRU<CompiledQuery>(cacheSize);
  return async ({
    context,
    document,
    operationName,
    request,
    queryHash,
  }: JITExecutorRequest) => {
    const prefix = operationName || "NotParametrized";
    const cacheKey = `${prefix}-${queryHash}`;
    let compiledQuery = cache.get(cacheKey);
    if (!compiledQuery) {
      const compilationResult = compileQuery(
        schema as CompiledSchema,
        document as CompiledDocument,
        operationName || undefined,
        compilerOpts
      );
      if (isCompiledQuery(compilationResult as CompiledOrResult)) {
        compiledQuery = compilationResult as CompiledQuery;
        cache.set(cacheKey, compiledQuery);
      } else {
        // ...is ExecutionResult
        return compilationResult;
      }
    }
    return compiledQuery.query(undefined, context, request.variables || {});
  };
}
