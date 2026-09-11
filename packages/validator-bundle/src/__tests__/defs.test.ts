import { StringSchema } from "yup";

export interface ITestStringSchema extends StringSchema<string> {
  isNotBomb(prefix?: string): StringSchema<string>;
  reverse(prefix?: string): StringSchema<string>;
}

describe("Validator Bundle Definitions", () => {
  it("should have proper type definitions", () => {
    // Type definitions are tested via TypeScript compilation
    expect(true).toBe(true);
  });
});
