import { addLinks, lookup } from "../../core/api";
import { getRandomCollection } from "../integration/helpers";

describe("Native equality lookup", () => {
  it("supports scalar/array/inverse links and nested custom pipelines", async () => {
    const parents = await getRandomCollection("EqualityParents");
    const children = await getRandomCollection("EqualityChildren");
    const inserted = await children.insertMany([{ name: "A" }, { name: "B" }]);
    await parents.insertOne({
      childId: inserted.insertedIds[0],
      ids: [
        inserted.insertedIds[1],
        inserted.insertedIds[0],
        inserted.insertedIds[1],
      ],
    });
    addLinks(parents, {
      child: { collection: () => children, index: false, field: "childId" },
      children: {
        collection: () => children,
        index: false,
        field: "ids",
        many: true,
      },
    });
    addLinks(children, {
      parents: {
        collection: () => parents,
        index: false,
        inversedBy: "children",
      },
    });
    for (const link of ["child", "children"]) {
      const legacy = await parents.aggregate([lookup(parents, link)]).toArray();
      const equality = await parents
        .aggregate([lookup(parents, link, { strategy: "equality" })])
        .toArray();
      expect(
        equality[0][link].map((child) => child._id.toString()).sort(),
      ).toEqual(legacy[0][link].map((child) => child._id.toString()).sort());
    }
    const result = await children
      .aggregate([
        lookup(children, "parents", {
          strategy: "equality",
          as: "owners",
          pipeline: [{ $project: { ids: 1 } }],
        }),
      ])
      .toArray();
    expect(result.every((child) => child.owners.length === 1)).toBe(true);
    expect(Object.keys(result[0].owners[0]).sort()).toEqual(["_id", "ids"]);
    const stage = lookup(parents, "child", { strategy: "equality" }).$lookup;
    expect(stage).not.toHaveProperty("pipeline");
    expect(stage).not.toHaveProperty("let");
    expect(stage).toMatchObject({ localField: "childId", foreignField: "_id" });
    await Promise.all([parents.drop(), children.drop()]);
  });

  it("preserves legacy matching by default and makes null matching opt-in", async () => {
    const parents = await getRandomCollection("NullParents");
    const children = await getRandomCollection("NullChildren");
    await parents.insertOne({});
    await children.insertOne({ code: null });
    addLinks(parents, {
      child: {
        collection: () => children,
        index: false,
        field: "code",
        foreignField: "code",
      },
    });
    const legacy = await parents
      .aggregate([lookup(parents, "child")])
      .toArray();
    const equality = await parents
      .aggregate([lookup(parents, "child", { strategy: "equality" })])
      .toArray();
    expect(legacy[0].child).toEqual([]);
    expect(equality[0].child).toHaveLength(1);
    expect(() =>
      lookup(parents, "child", { strategy: "invalid" as any }),
    ).toThrow("Unknown lookup strategy");
    await Promise.all([parents.drop(), children.drop()]);
  });
});
