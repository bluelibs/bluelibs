import {
  app,
  collection,
  field,
  relation,
  shortcuts,
  faker,
} from "../utils";

export const {{ collection }} = collection({
  id: "{{ collection }}",
  fields: [
    field.string("example"),
  ],
  mock: {
    count: 100,
  },
  relations: [
  ],
});
