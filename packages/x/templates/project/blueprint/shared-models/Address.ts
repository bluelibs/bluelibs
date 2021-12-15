import {
  generateProject,
  app,
  collection,
  field,
  relation,
  shortcuts,
  sharedModel,
  GeneratorKind,
  faker,
} from "../utils";

export const Address = sharedModel({
  id: "Address",
  fields: [field.string("city"), field.string("country")],
});
