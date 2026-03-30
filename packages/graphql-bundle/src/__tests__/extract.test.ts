import TestModule from "./extract-test";
import { Loader } from "..";
import { assert } from "chai";

describe("Extraction", () => {
  it("Should work", () => {
    const loader = new Loader();

    loader.load(TestModule);

    const schema = loader.getSchema();

    assert.equal((schema.resolvers!.A as any)["test1"], 1);
    assert.equal((schema.resolvers!.A as any)["test2"], 1);
    assert.equal((schema.resolvers!.A as any)["test3"], 1);
    assert.equal((schema.resolvers!.A as any)["test4"], 1);

    assert.include(schema.typeDefs, "somethingReallyGood");
    assert.include(schema.typeDefs, "somethingGood");
  });
});
