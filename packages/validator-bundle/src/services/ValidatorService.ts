import { ContainerInstance, Constructor, Service } from "@bluelibs/core";
import { IValidationMethod, IValidateOptions } from "../defs";
import { SchemaNotIdentifiedException } from "../exceptions";
import {
  addMethod,
  mixed as MixedSchema,
  ObjectSchema,
  TestContext,
} from "yup";
import { IValidationTransformer } from "../defs";
import { getSchemaByType } from "../yup-decorator";

@Service()
export class ValidatorService {
  constructor(protected readonly container: ContainerInstance) {}

  async validate<T = any>(object: any, options?: IValidateOptions) {
    return this.getSchema(object, options).validate(object, options);
  }

  async isValid(object: any, options?: IValidateOptions) {
    return this.getSchema(object, options).isValid(object, options);
  }

  async validateAt(path: string, object: any, options?: IValidateOptions) {
    return this.getSchema(object, options).validateAt(path, object, options);
  }

  cast(object: any, options?: IValidateOptions) {
    return this.getSchema(object, options).cast(object, options);
  }

  getSchema(object: any, options?: IValidateOptions): ObjectSchema<any> {
    let model;
    if (options?.model) {
      model = options.model;
    } else {
      if (object.constructor) {
        model = object.constructor;
      }
    }

    if (!model) {
      throw new SchemaNotIdentifiedException();
    }

    return getSchemaByType(model);
  }

  getSchemaByClass(target): ObjectSchema<any> {
    return getSchemaByType(target);
  }

  addMethod(methodClass: Constructor<IValidationMethod>) {
    const method = this.container.get<IValidationMethod>(methodClass);

    let { parent, name } = method;

    if (!parent) {
      parent = MixedSchema;
    }

    addMethod<any>(parent, name, function (config?: any) {
      return this.test({
        name: name,
        message: config?.message || method.message,
        params: config,
        async test(value) {
          return method.validate(value, config, this);
        },
      });
    });
  }

  addTransformer(transformerClass: { new (): IValidationTransformer }) {
    const transformer = this.container.get<IValidationTransformer>(
      transformerClass
    );
    let { parent, name } = transformer;

    if (!parent) {
      parent = MixedSchema;
    }

    addMethod<any>(parent, name, function (config?: any) {
      return this.transform(function (value, originalValue) {
        return transformer.transform(value, originalValue, config, this);
      });
    });
  }
}
