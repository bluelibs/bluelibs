import { toModel, ToModelOptions } from "@bluelibs/ejson";
import { ValidatorService, IValidateOptions } from "@bluelibs/validator-bundle";

export interface IToModelExecutorOptions {
  field?: string;
  /**
   * Use this for Update methods in which you don't want to set the default values.
   */
  partial?: boolean;
}

export function ToModel(model: any, options: IToModelExecutorOptions = {}) {
  if (!options.field) {
    options.field = "input";
  }
  let toModelOptions: Partial<ToModelOptions> = {};
  if (options.partial) {
    toModelOptions.partial = true;
  }

  return async function ToModel(_, args, ctx, ast) {
    args[options.field] = toModel(
      model,
      args[options.field],
      toModelOptions as ToModelOptions
    );
  };
}

export interface IValidateExecutorOptions extends IValidateOptions {
  field?: string;
  /**
   * Use this option as true when you are performing validation only on the specified fields. Commonly used when you have default values on your model.
   * Alias for `stripUnknown` behind the scenes, named this way for convenience when using ToModel with the same method.
   */
  partial?: boolean;
}

export function Validate(options: IValidateExecutorOptions = {}) {
  if (!options.field) {
    options.field = "input";
  }

  return async function Validate(_, args, ctx, ast) {
    const validator: ValidatorService = ctx.container.get(ValidatorService);

    await validator.validate(args[options.field], {
      ...options,
      stripUnknown: options.partial === true ? true : false,
    });
  };
}
