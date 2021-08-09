import { yup, IValidationMethod, TestContext } from "@bluelibs/validator-bundle";
import { Collection } from "@bluelibs/mongo-bundle";
import { ContainerInstance, Constructor } from "@bluelibs/core";
import "{{ validatorClassName }}.declarations";

export type {{ validatorClassName }}Config = {
  message?: string;
}

export class {{ validatorClassName }}
implements IValidationMethod<I{{ validatorClassName }}Config> {
  parent = yup.{{ yupValidationType }}; // optional, defaults to yup.mixed, so to all
  name = "{{ validatorName }}";

  constructor(protected readonly container: ContainerInstance) {}

  async validate(value: any, config: {{ validatorClassName }}Config, context: TestContext) {
    // The 3d argument, the context, is properly described here:
    // https://github.com/jquense/yup#mixedtestname-string-message-string--function-test-function-schema

    let { message } = config;

    // Use the value to ensure this is valid
    // If you need other information
    let isValid = true;

    if (isValid) {
      return true;
    } else {
      context.createError(
        message || `You haven't implemented this validation logic`
      );
    }
  }
}