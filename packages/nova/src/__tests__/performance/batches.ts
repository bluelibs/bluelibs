import { addLinks, query } from "../../core/api";
import { Requests, deferred } from "../concurrency/helpers";

describe("Pagination batch scheduling", () => {
  it("shares maxCap across batches, siblings and unlocked descendants", async () => {
    const requests = new Requests();
    const aGate = deferred(),
      bGate = deferred(),
      nextGate = deferred();
    const parents = requests.collection(
      "parents",
      Array.from({ length: 129 }, (_, index) => ({ _id: String(index) })),
    );
    const makeChildren = (prefix: string, gate) => {
      const collection = requests.collection(
        prefix,
        (pipeline) =>
          pipeline[1].$unionWith.pipeline[0].$documents.$literal.map(
            ({ index, key }) => ({
              index,
              child: {
                _id: prefix + key,
                rootId: key,
                nextId: "next",
                name: prefix,
              },
            }),
          ),
        gate,
      );
      // The fixture supplies the collection capability needed for native batching.
      Object.assign(collection, { db: {} });
      addLinks(collection, {
        parent: { collection: () => parents, field: "rootId" },
      });
      return collection;
    };
    const a = makeChildren("a", aGate),
      b = makeChildren("b", bGate);
    const next = requests.collection(
      "next",
      [{ _id: "next", name: "Next" }],
      nextGate,
    );
    addLinks(a, { next: { collection: () => next, field: "nextId" } });
    addLinks(parents, {
      a: { collection: () => a, inversedBy: "parent" },
      b: { collection: () => b, inversedBy: "parent" },
    });
    const result = query(
      parents,
      {
        a: {
          $: { options: { sort: { _id: 1 }, limit: 1 } },
          next: { name: 1 },
        },
        b: { $: { options: { sort: { _id: 1 }, limit: 1 } }, name: 1 },
      },
      { maxCap: 2 },
    ).fetch();
    await requests.waitForStart("b");
    expect(requests.active).toBe(2);
    aGate.resolve();
    await requests.waitForStart("next");
    expect(requests.finished).not.toContain("b");
    nextGate.resolve();
    bGate.resolve();
    const delivered = await result;
    expect(delivered).toHaveLength(129);
    expect(delivered[128].a[0].next.name).toBe("Next");
    expect(delivered[128].b[0].name).toBe("b");
    expect(requests.started.filter((name) => name === "a")).toHaveLength(2);
    expect(requests.started.filter((name) => name === "b")).toHaveLength(2);
    expect(requests.peak).toBe(2);
    expect(requests.active).toBe(0);
  });
});
