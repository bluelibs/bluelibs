import TestModule from "./extract-test";
import { Loader } from "..";
import { assert } from "chai";

describe("Extraction", () => {
  it("Should work", () => {
    const loader = new Loader();

    loader.load(TestModule);

    const schema = loader.getSchema();

    const resolversA = schema.resolvers!.A as unknown as Record<string, unknown>;

    assert.equal(resolversA["test1"], 1);
    assert.equal(resolversA["test2"], 1);
    assert.equal(resolversA["test3"], 1);
    assert.equal(resolversA["test4"], 1);

    assert.include(schema.typeDefs, "somethingReallyGood");
    assert.include(schema.typeDefs, "somethingGood");
  });
});
