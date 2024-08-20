import "@bluelibs/validator-bundle";
import { IUniqueFieldValidationConfig } from "./UniqueFieldValidationMethod";
import { ObjectIdSchema } from "./ObjectId.validator";
import "./ObjectId.validator";
import * as yup from "yup";

declare module "yup" {
  export interface DateSchema {
    format(format?: string): DateSchema;
  }

  export interface StringSchema {
    /**
     * Specify a unique constraint for this field
     */
    uniqueField(config?: IUniqueFieldValidationConfig): StringSchema;
  }

  export interface NumberSchema {
    /**
     * Specify a unique constraint for this field
     */
    uniqueField(config?: IUniqueFieldValidationConfig): NumberSchema;
  }

  export type ObjectIdSchemaConstructor = {
    new (...args: any[]): typeof ObjectIdSchema;
  };

  export const objectId: () => typeof ObjectIdSchema;
}
