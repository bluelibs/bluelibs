import * as yup from "yup";
import { yup as kyup } from "@bluelibs/validator-bundle";
import { ObjectId } from "@bluelibs/ejson";

export class ObjectIdSchema extends yup.BaseSchema<any> {
  constructor() {
    super({ type: "objectId" });

    this.withMutation((schema) => {
      schema.transform(function (value) {
        if (value && typeof value === "string") {
          return new ObjectId(value);
        }
        return value;
      });
    });
  }

  protected _typeCheck(_value: any): _value is NonNullable<any> {
    try {
      return ObjectId.isValid(_value);
    } catch (e) {
      return false;
    }
  }
}
// Ignore it because it's a readonly property
Object.assign(yup, {
  objectId: () => new ObjectIdSchema(),
});
Object.assign(kyup, {
  objectId: () => new ObjectIdSchema(),
});
