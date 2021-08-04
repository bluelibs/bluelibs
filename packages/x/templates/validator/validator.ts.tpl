import { yup, IValidationMethod } from "@bluelibs/validator-bundle";
import { Collection } from "@bluelibs/mongo-bundle";
import { ContainerInstance, Constructor } from "@bluelibs/core";
import "{{ validatorClassName }}.declarations";

export interface I{{ validatorClassName }}Config {
  message?: string;
}

export class {{ validatorClassName }}
implements IValidationMethod<I{{ validatorClassName }}Config> {
  parent = yup.{{ yupValidationType }}; // optional, defaults to yup.mixed, so to all
  name = "{{ validatorName }}";

  constructor(protected readonly container: ContainerInstance) {}

  async validate(
  value: any,
  config: I{{ validatorClassName }}Config,
  { createError, path }
  ) {
  // The 3d argument, the context, is properly described here:
  // https://github.com/jquense/yup#mixedtestname-string-message-string--function-test-function-schema

  let { message } = config;

  // Use the value to ensure this is valid
  // If you need other information

  createError(
  message || `You haven't implemented this validation logic`
  );
  }
  }