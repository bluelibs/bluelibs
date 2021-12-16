import {
  field,
  relation,
  shortcuts,
  sharedModel,
  faker,
} from "../utils";

export const {{ name }} = sharedModel({
  id: "{{ name }}",
  {{# if isEnum }}
    enumValues: [
      "VALUE_ONE",
      "VALUE_TWO"
    ],
  {{ else }}
    fields: [
      field.string("example"),
    ],
  {{/ if }}
});
