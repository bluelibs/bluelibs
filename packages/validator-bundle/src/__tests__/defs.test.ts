import { StringSchema } from "yup";

export interface ITestStringSchema extends StringSchema<string> {
  isNotBomb(prefix?: string): StringSchema<string>;
  reverse(prefix?: string): StringSchema<string>;
}
