import {
  field,
  relation,
  shortcuts,
  sharedModel,
  faker,
} from "../utils";

export const {{ name }} = sharedModel({
  id: "{{ name }}",
  fields: [
    field.string("example"),
  ],
});
