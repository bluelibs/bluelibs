import { Loader } from "../Loader";
import { assert } from "chai";

describe("Loader", () => {
  it("Should properly load all the data", async () => {
    const loader = new Loader();

    loader.load({
      typeDefs: `type Query { getSomething: String }`,
      resolvers: {
        Query: {
          getSomething: () => "Something",
        },
      },
      contextReducers: [
        function a(context) {
          return {
            ...context,
            a: "here",
          };
        },
      ],
      schemaDirectives: [{ a: "1", b: "2" }],
    });

    loader.load({
      typeDefs: `type Query { getSomethingElse: String }`,
      resolvers: {
        Query: {
          getSomethingElse: () => "Something else",
        },
      },
      contextReducers: (c) => c,
      schemaDirectives: { c: "3" },
    });

    loader.load([
      {
        typeDefs: `type Query { arrayMode: String }`,
      },
    ]);

    loader.load({
      resolvers: null,
    });

    const schema = loader.getSchema();

    assert.isString(schema.typeDefs);
    assert.isObject(schema.resolvers);
    assert.isObject(schema.schemaDirectives);
    assert.isArray(schema.contextReducers);
  });
});
