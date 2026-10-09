import { Collection } from "mongodb";
import { addLinks, query } from "../../core/api";
import { client } from "../connection";
import { getRandomCollection } from "../integration/helpers";

describe("Paginated lookup options", () => {
  let parents: Collection, children: Collection;
  beforeEach(async () => {
    parents = await getRandomCollection("OptionsParents");
    children = await client
      .db("test")
      .createCollection(`OptionsChildren${Date.now()}`, {
        collation: { locale: "en", strength: 2 },
      });
    await parents.insertMany([{ code: "abc" }, { code: "abc" }]);
    await children.insertOne({ parentCode: "ABC", seq: 1 });
    addLinks(parents, {
      children: {
        collection: () => children,
        inversedBy: "parent",
        index: false,
      },
    });
    addLinks(children, {
      parent: {
        collection: () => parents,
        field: "parentCode",
        foreignField: "code",
        index: false,
      },
    });
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    await Promise.all([parents.drop(), children.drop()]);
  });

  function body(options = {}) {
    return {
      children: {
        $: { options: { sort: { seq: -1 }, limit: 1, ...options } },
        seq: 1,
      },
    };
  }

  it("preserves collection-default collation and explicit collation overrides", async () => {
    const fast = await query(parents, body()).fetch();
    expect(fast.every((parent) => parent.children[0].seq === 1)).toBe(true);
    expect(await query(parents, body({ hint: "_id_" })).fetch()).toEqual(fast);
    const simple = await query(
      parents,
      body({ collation: { locale: "simple" } }),
    ).fetch();
    expect(simple.every((parent) => parent.children.length === 0)).toBe(true);
  });
  it("retains inverse many-to-many membership matching with pagination", async () => {
    await children.updateMany(
      {},
      { $set: { links: { codes: ["ABC", "ABC"] } } },
    );
    addLinks(children, {
      owners: {
        collection: () => parents,
        field: "links.codes",
        foreignField: "code",
        many: true,
        index: false,
      },
    });
    addLinks(parents, {
      shared: {
        collection: () => children,
        inversedBy: "owners",
        index: false,
      },
    });
    const makeBody = (options = {}) => ({
      shared: {
        $: { options: { sort: { seq: -1 }, limit: 1, ...options } },
        seq: 1,
      },
    });
    const result = await query(parents, makeBody()).fetch();
    expect(result.every((parent) => parent.shared.length === 1)).toBe(true);
    expect(await query(parents, makeBody({ hint: "_id_" })).fetch()).toEqual(
      result,
    );
  });
});
