import { field, sharedModel } from "../utils";

export const Address = sharedModel({
  id: "Address",
  fields: [field.string("city"), field.string("country")],
});
