import { ContainerInstance, Constructor, Service } from "@bluelibs/core";
import { IValidationMethod, IValidateOptions } from "../defs";
import { SchemaNotIdentifiedException } from "../exceptions";
import {
  addMethod,
  AnyObjectSchema,
  AnySchema,
  mixed as MixedSchema,
} from "yup";
import { IValidationTransformer } from "../defs";
import { getSchemaByType } from "../yup-decorator";

@Service()
export class ValidatorService {
  constructor(protected readonly container: ContainerInstance) {}

  async validate(object: unknown, options?: IValidateOptions) {
    return this.getSchema(object, options).validate(object, options);
  }

  async isValid(object: unknown, options?: IValidateOptions) {
    return this.getSchema(object, options).isValid(object, options);
  }

  async validateAt(path: string, object: unknown, options?: IValidateOptions) {
    return this.getSchema(object, options).validateAt(path, object, options);
  }

  cast(object: unknown, options?: IValidateOptions) {
    return this.getSchema(object, options).cast(object, options);
  }

  getSchema(object: unknown, options?: IValidateOptions): AnyObjectSchema {
    let model: Function | undefined;
    if (options?.model) {
      model = options.model;
    } else {
      const constructor = (object as { constructor?: Function }).constructor;
      if (constructor) {
        model = constructor;
      }
    }

    if (!model) {
      throw new SchemaNotIdentifiedException();
    }

    return getSchemaByType(model);
  }

  getSchemaByClass(target: Function): AnyObjectSchema {
    return getSchemaByType(target);
  }

  addMethod(methodClass: Constructor<IValidationMethod>) {
    const method = this.container.get<IValidationMethod>(methodClass);

    const { name } = method;
    let { parent } = method;

    if (!parent) {
      parent = MixedSchema;
    }

    addMethod<any>(
      parent,
      name,
      // why: addMethod's generic is `any` because `parent` is a union of a
      // constructor and a schema callable, which does not satisfy yup's
      // generic overloads; the config is a user-supplied argument forwarded
      // verbatim into yup's params.
      function (config?: unknown) {
        return this.test({
          name: name,
          message:
            (config as { message?: string } | undefined)?.message ||
            method.message,
          params: config as Record<string, unknown> | undefined,
          async test(value) {
            return method.validate(value, config, this);
          },
        });
      }
    );
  }

  addTransformer(transformerClass: { new (): IValidationTransformer }) {
    const transformer =
      this.container.get<IValidationTransformer>(transformerClass);
    const { name } = transformer;
    let { parent } = transformer;

    if (!parent) {
      parent = MixedSchema;
    }

    addMethod<any>(
      parent,
      name,
      // why: see addMethod above — `parent` is a union type and the config is
      // forwarded verbatim into yup's transform callback.
      function (config?: unknown) {
        return this.transform(function (
          this: AnySchema,
          value: unknown,
          originalValue: unknown
        ) {
          return transformer.transform(value, originalValue, config, this);
        });
      }
    );
  }
}
