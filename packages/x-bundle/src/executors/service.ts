import { Constructor, Token } from "@bluelibs/core";

export function ToService<T>(
  serviceClass: Constructor<T> | any,
  methodName: string,
  argumentMapper?: (args, ctx, ast) => any[]
) {
  if (!argumentMapper) {
    argumentMapper = (args, ctx, ast) => [args.input, ctx.userId];
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
