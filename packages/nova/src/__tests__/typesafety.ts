import { Collection } from "mongodb";
import { decorate, query } from "../core/api";

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
    const myCollection = decorate<ExtendedCustomType>(collection);

    myCollection.query({
      $: {},
      message: 1,
      index: 1,
      somethingElse: 1,
      // @ts-expect-error
      asfasf: 1,
    });
  });
});
