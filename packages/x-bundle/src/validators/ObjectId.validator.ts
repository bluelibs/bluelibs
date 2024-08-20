import * as yup from "yup";
import { yup as kyup } from "@bluelibs/validator-bundle";
import { ObjectId } from "@bluelibs/ejson";

export const ObjectIdSchema = yup
  .mixed((input): input is ObjectId => input instanceof ObjectId)
  .transform((value: any, input, ctx) => {
    if (ctx.isType(value)) return value;
    return new ObjectId(value);
  });

// Ignore it because it's a readonly property
Object.assign(yup, {
  objectId: () => ObjectIdSchema.clone(),
});
Object.assign(kyup, {
  objectId: () => ObjectIdSchema.clone(),
});
