import { Constructor, Token } from "@bluelibs/core";
import { IGraphQLContext } from "@bluelibs/graphql-bundle";

export function ToService<T>(
  serviceClass: Constructor<T> | Token<T>,
  methodName: string,
  argumentMapper?: (
    args: Record<string, unknown>,
    ctx: IGraphQLContext,
    ast: unknown
  ) => unknown[]
) {
  if (!argumentMapper) {
    argumentMapper = (args, ctx) => [args.input, ctx.userId];
  }

  return async function (_, args, ctx, ast) {
    const service: T = ctx.container.get(serviceClass);
    if (!service[methodName]) {
      throw new Error(
        `[ToService] Method ${methodName} was not found on the provided service.`
      );
    }

    return service[methodName].call(service, ...argumentMapper(args, ctx, ast));
  };
}
