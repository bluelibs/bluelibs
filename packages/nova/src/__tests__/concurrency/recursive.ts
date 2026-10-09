import { addLinks, query } from "../../core/api";
import { Requests, deferred } from "./helpers";

describe("Recursive query request concurrency", () => {
  it.each([1, 2])(
    "caps per-parent direct and virtual requests (maxCap: %s)",
    async (maxCap) => {
      const requests = new Requests();
      const aGate = deferred();
      const bGate = deferred();
      const root = requests.collection("root", [
        { _id: "root1", aId: "a1" },
        { _id: "root2", aId: "a2" },
      ]);
      const a = requests.collection(
        "a",
        (pipeline) => {
          const id = pipeline.find((stage) => stage.$match).$match._id.$in[0];
          return [{ _id: id, name: id }];
        },
        aGate,
      );
      const b = requests.collection(
        "b",
        (pipeline) => {
          const id = pipeline.find((stage) => stage.$match).$match.rootId
            .$in[0];
          return [{ _id: "b" + id, name: id, rootId: id }];
        },
        bGate,
      );
      addLinks(root, {
        a: { collection: () => a, field: "aId" },
        bs: { collection: () => b, inversedBy: "root" },
      });
      addLinks(b, { root: { collection: () => root, field: "rootId" } });
      const result = query(
        root,
        {
          _id: 1,
          a: { $: () => ({ options: { hint: "aIndex" } }), name: 1 },
          bs: { $: { options: { limit: 1, skip: 0 } }, name: 1, rootId: 1 },
        },
        { maxCap },
      ).fetch();
      await requests.waitForStart("a");
      if (maxCap === 2) {
        await requests.waitForStart("a", 2);
        expect(requests.active).toBe(2);
      }
      aGate.resolve();
      await requests.waitForStart("b");
      bGate.resolve();
      expect(await result).toEqual([
        {
          _id: "root1",
          a: { _id: "a1", name: "a1" },
          bs: [{ _id: "broot1", name: "root1", rootId: "root1" }],
        },
        {
          _id: "root2",
          a: { _id: "a2", name: "a2" },
          bs: [{ _id: "broot2", name: "root2", rootId: "root2" }],
        },
      ]);
      expect(requests.started.filter((name) => name === "a")).toHaveLength(2);
      expect(requests.started.filter((name) => name === "b")).toHaveLength(2);
      expect(requests.peak).toBe(maxCap);
      expect((a.aggregate as jest.Mock).mock.calls[0][1].hint).toBe("aIndex");
      expect(requests.active).toBe(0);
    },
  );
});
