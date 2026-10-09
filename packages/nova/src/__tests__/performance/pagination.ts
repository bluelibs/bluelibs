import { Collection, ObjectId } from "mongodb";
import { addLinks, addReducers, query } from "../../core/api";
import { getRandomCollection } from "../integration/helpers";

describe("Batched per-parent pagination", () => {
  let parents: Collection, children: Collection, authors: Collection;
  let parentIds: ObjectId[], authorId: ObjectId;
  beforeEach(async () => {
    parents = await getRandomCollection("PaginationParents");
    children = await getRandomCollection("PaginationChildren");
    authors = await getRandomCollection("PaginationAuthors");
    parentIds = [new ObjectId(), new ObjectId(), new ObjectId()];
    authorId = (await authors.insertOne({ name: "Author" })).insertedId;
    await parents.insertMany(parentIds.map((_id, index) => ({ _id, index })));
    await children.insertMany(
      parentIds
        .slice(0, 2)
        .flatMap((parentId) =>
          Array.from({ length: 6 }, (_, seq) => ({ parentId, seq, authorId })),
        ),
    );
    await children.createIndex({ parentId: 1, seq: -1, _id: 1 });
    addLinks(parents, {
      children: {
        collection: () => children,
        index: false,
        inversedBy: "parent",
      },
    });
    addLinks(children, {
      parent: { collection: () => parents, index: false, field: "parentId" },
      author: { collection: () => authors, index: false, field: "authorId" },
    });
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    await Promise.all([parents.drop(), children.drop(), authors.drop()]);
  });

  function body(options = {}) {
    return {
      $: { options: { sort: { index: 1 } } },
      index: 1,
      children: {
        $: {
          filters: { seq: { $gte: 1 }, parentId: new ObjectId() },
          options: { sort: { seq: -1, _id: 1 }, limit: 2, skip: 1, ...options },
        },
        seq: 1,
        author: { name: 1 },
      },
    };
  }

  it("batches fixed filters/sort/skip/limit and projects every descendant", async () => {
    const aggregate = jest.spyOn(children, "aggregate");
    const result = await query(
      parents,
      body({ comment: "pagination", maxTimeMS: 5000 }),
      { maxCap: 1 },
    ).fetch();
    expect(
      result.map((parent) => parent.children.map((child) => child.seq)),
    ).toEqual([[4, 3], [4, 3], []]);
    for (const parent of result)
      for (const child of parent.children) {
        expect(child.author).toEqual({ _id: authorId, name: "Author" });
        expect(Object.keys(child).sort()).toEqual(["_id", "author", "seq"]);
      }
    expect(aggregate).toHaveBeenCalledTimes(1);
    expect(aggregate.mock.calls[0][1]).toMatchObject({
      comment: "pagination",
      maxTimeMS: 5000,
    });
    // An unsupported foreign hint must use the original per-parent execution.
    const fallback = await query(parents, body({ hint: "_id_" }), {
      maxCap: 2,
    }).fetch();
    expect(fallback).toEqual(result);
    expect(aggregate).toHaveBeenCalledTimes(4);
  });

  it("uses fetched computed keys and dotted custom link fields", async () => {
    await parents.updateMany(
      {},
      { $set: { original: "old", computed: "new" } },
    );
    await children.updateMany({}, { $set: { link: { code: "new" } } });
    addLinks(parents, {
      computedChildren: {
        collection: () => children,
        index: false,
        inversedBy: "customParent",
      },
    });
    addLinks(children, {
      customParent: {
        collection: () => parents,
        index: false,
        field: "link.code",
        foreignField: "original",
      },
    });
    const result = await query(parents, {
      $: { pipeline: [{ $set: { original: "$computed" } }] },
      computedChildren: {
        $: { options: { sort: { seq: -1, _id: 1 }, limit: 1 } },
        seq: 1,
      },
    }).fetch();
    expect(result).toHaveLength(3);
    expect(result.every((parent) => parent.computedChildren[0].seq === 5)).toBe(
      true,
    );
  });

  it("retains separate copies of shared direct children, ordering and empty defaults", async () => {
    const shared = await children
      .find()
      .sort({ seq: -1, _id: 1 })
      .limit(2)
      .toArray();
    await parents.updateMany(
      {},
      { $set: { ids: [shared[1]._id, shared[0]._id, shared[1]._id] } },
    );
    await parents.updateOne({ _id: parentIds[2] }, { $unset: { ids: "" } });
    addLinks(parents, {
      direct: {
        collection: () => children,
        index: false,
        field: "ids",
        many: true,
      },
    });
    const result = await query(parents, {
      $: { options: { sort: { index: 1 } } },
      direct: {
        $: { options: { sort: { seq: -1, _id: 1 }, limit: 2 } },
        seq: 1,
        author: { name: 1 },
      },
    }).fetch();
    expect(result[0].direct.map((child) => child._id)).toEqual(
      shared.map((child) => child._id),
    );
    expect(result[1].direct).toEqual(result[0].direct);
    expect(result[1].direct[0]).not.toBe(result[0].direct[0]);
    expect(
      result[1].direct.every(
        (child) => child.author.name === "Author" && !child.authorId,
      ),
    ).toBe(true);
    expect(result[2].direct).toEqual([]);
    const unpaginated = await query(parents, {
      $: { options: { sort: { index: 1 } } },
      direct: { seq: 1 },
    }).fetch();
    expect(unpaginated[0].direct.map((child) => child._id)).toEqual([
      shared[1]._id,
      shared[0]._id,
      shared[1]._id,
    ]);
  });

  it("applies JavaScript reducers and aliases after batching", async () => {
    addReducers(children, {
      doubled: { dependency: { seq: 1 }, reduce: (child) => child.seq * 2 },
    });
    const result = await query(
      parents,
      {
        newest: {
          $alias: "children",
          $: { options: { sort: { seq: -1 }, limit: 1 } },
          doubled: 1,
        },
        oldest: {
          $alias: "children",
          $: { options: { sort: { seq: 1 }, limit: 1 } },
          doubled: 1,
        },
      },
      { maxCap: 1 },
    ).fetch();
    expect(result[0].newest[0].doubled).toBe(10);
    expect(result[0].oldest[0].doubled).toBe(0);
    expect(result[0].newest[0]).not.toHaveProperty("seq");
  });

  it("bounds batch input and handles an empty foreign collection", async () => {
    await parents.insertMany(Array.from({ length: 127 }, () => ({})));
    await children.deleteMany({});
    const aggregate = jest.spyOn(children, "aggregate");
    const result = await query(parents, body(), { maxCap: 1 }).fetch();
    expect(result).toHaveLength(130);
    expect(result.every((parent) => parent.children.length === 0)).toBe(true);
    expect(aggregate).toHaveBeenCalledTimes(2);
    expect(
      aggregate.mock.calls[0][0][1].$unionWith.pipeline[0].$documents.$literal,
    ).toHaveLength(128);
  });

  it("keeps pipelines and pipeline reducers on the per-parent fallback", async () => {
    addReducers(children, {
      plusOne: {
        dependency: { seq: 1 },
        pipeline: [{ $set: { plusOne: { $add: ["$seq", 1] } } }],
      },
    });
    const aggregate = jest.spyOn(children, "aggregate");
    const result = await query(
      parents,
      {
        children: {
          $: {
            pipeline: [{ $match: { seq: { $gte: 3 } } }],
            options: { sort: { seq: 1 }, limit: 1 },
          },
          plusOne: 1,
          author: { name: 1 },
        },
      },
      { maxCap: 2 },
    ).fetch();
    expect(result[0].children[0].plusOne).toBe(4);
    expect(result[1].children[0].author.name).toBe("Author");
    expect(aggregate).toHaveBeenCalledTimes(3);
  });
});
