import { Constructor } from "@bluelibs/core";
import { TestContext, AnySchema } from "yup";
import { ValidateOptions } from "./yup-decorator";

// Copied from yup beause they don't export it
export interface IValidateOptions extends ValidateOptions {
  /**
   * This represents a schema model class created with @Schema decorator
   */
  model?: Function;
}

export interface IValidationMethod<T = unknown, V = unknown> {
  name: string;
  message?: string;
  parent?: () => AnySchema | Constructor<AnySchema>;
  /**
   * Return "ok" if everything was ok
   * @param value
   * @param config
   * @param yupContext
   */
  validate(
    value: V,
    config: T,
    yupContext: TestContext
  ): Promise<boolean | string | undefined>;
}

export interface IValidationTransformer<
  C = unknown,
  V = unknown,
  Schema = AnySchema,
> {
  name: string;
  parent?: () => AnySchema | Constructor<AnySchema>;
  transform(value: V, originalValue: V, config: C, schema: Schema): V;
}
