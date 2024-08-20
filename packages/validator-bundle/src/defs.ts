import { Constructor } from "@bluelibs/core";
import { TestContext, MixedSchema, string, AnySchema, StringSchema } from "yup";
import { ValidateOptions } from "./yup-decorator";

// Copied from yup beause they don't export it
export interface IValidateOptions extends ValidateOptions {
  /**
   * This represents a schema model class created with @Schema decorator
   */
  model?: any;
}

export interface IValidationMethod<T = any, V = any> {
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

export interface IValidationTransformer<C = any, V = any, Schema = AnySchema> {
  name: string;
  parent?: () => AnySchema | Constructor<AnySchema>;
  transform(
    value: any | V,
    originalValue: any | V,
    config: C,
    schema: Schema
  ): V;
}
