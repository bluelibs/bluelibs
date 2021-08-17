import { IAstToQueryOptions } from "@bluelibs/nova";

export type GraphQLToNovaOptionsResolverType<T> = (
  _,
  args,
  ctx,
  ast
) => IAstToQueryOptions<T> | Promise<IAstToQueryOptions<T>>;
