import { ClientSession, Collection } from "mongodb";
import { addLinks, query } from "../../core/api";
import { client } from "../connection";
import { getRandomCollection } from "../integration/helpers";

// This entry point runs against a replica set; ordinary Nova tests also support standalone MongoDB.
beforeAll(async () => {
  await client.connect();
});
afterAll(async () => {
  await client.close();
});

describe("Paginated queries in transactions", () => {
  let parents: Collection, children: Collection, session: ClientSession;
  beforeEach(async () => {
    parents = await getRandomCollection("TransactionParents");
    children = await getRandomCollection("TransactionChildren");
    const inserted = await parents.insertMany([{ code: "a" }, { code: "b" }]);
    await children.insertMany(
      Object.values(inserted.insertedIds).map((parentId, seq) => ({
        parentId,
        seq,
      })),
    );
    addLinks(parents, {
      children: {
        collection: () => children,
        inversedBy: "parent",
        index: false,
      },
    });
    addLinks(children, {
      parent: { collection: () => parents, field: "parentId", index: false },
    });
    session = client.startSession();
  });
  afterEach(async () => {
    await session.endSession();
    jest.restoreAllMocks();
    await Promise.all([parents.drop(), children.drop()]);
  });

  it("uses serialized per-parent collection reads within a real transaction", async () => {
    const aggregate = jest.spyOn(children, "aggregate");
    session.startTransaction();
    const result = await query(
      parents,
      {
        children: { $: { options: { sort: { seq: -1 }, limit: 1 } }, seq: 1 },
      },
      { session, maxCap: 3 },
    ).fetch();
    expect(result.every((parent) => parent.children.length === 1)).toBe(true);
    expect(aggregate).toHaveBeenCalledTimes(2);
    expect(
      aggregate.mock.calls.every(
        ([pipeline, options]) =>
          !pipeline.some((stage) => stage.$unionWith) &&
          options.session === session,
      ),
    ).toBe(true);
    await session.commitTransaction();
  });
});
