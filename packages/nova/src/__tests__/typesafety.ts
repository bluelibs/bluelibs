import { Collection } from "mongodb";
import { decorate } from "../core/api";

describe("Type safety", () => {
  it("Should work when querying a collection", () => {
    type CustomType = {
      message: string;
      index: number;
    };

    type ExtendedCustomType = CustomType & {
      somethingElse: string;
    };

    const collection = new Collection<CustomType>();
    const myCollection = decorate<ExtendedCustomType, CustomType>(collection);

    myCollection.query({
      $: {},
      message: 1,
      index: 1,
      somethingElse: 1,
      // @ts-expect-error unknown keys must be rejected by the query body type
      asfasf: 1,
    });

    myCollection.insertOne({
      message: "Hello",
      index: 1,
      // @ts-expect-error unknown keys must be rejected by the insert type
      somethingElse: "World",
    });
  });
});
