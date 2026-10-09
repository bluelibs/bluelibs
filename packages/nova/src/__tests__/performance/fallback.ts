import { ClientSession } from "mongodb";
import { query, addLinks, addReducers } from "../../core/api";
import { Requests, deferred, tree } from "../concurrency/helpers";

describe("Recursive fallback traversal", () => {
  it("retains every copy of a shared child for descendants and projection", async () => {
    const requests = new Requests();
    const parents = requests.collection("parents", [
      { _id: "a", childId: "same" },
      { _id: "b", childId: "same" },
      { _id: "empty" },
    ]);
    const children = requests.collection("children", [
      { _id: "same", authorId: "author" },
    ]);
    const authors = requests.collection("authors", [
      { _id: "author", name: "Author" },
    ]);
    addLinks(parents, {
      child: { collection: () => children, field: "childId" },
    });
    addLinks(children, {
      author: { collection: () => authors, field: "authorId" },
    });
    const result = await query(parents, {
      child: { $: () => ({}), author: { name: 1 } },
    }).fetch();
    expect(result).toEqual([
      {
        _id: "a",
        child: { _id: "same", author: { _id: "author", name: "Author" } },
      },
      {
        _id: "b",
        child: { _id: "same", author: { _id: "author", name: "Author" } },
      },
      { _id: "empty", child: null },
    ]);
    expect(result[0].child).not.toBe(result[1].child);
  });

  it("clears descendant results when a reused query becomes empty", async () => {
    const requests = new Requests();
    let executions = 0;
    const parents = requests.collection("parents", () =>
      executions++ === 0 ? [{ _id: "parent", childId: "child" }] : [],
    );
    const children = requests.collection("children", [{ _id: "child" }]);
    const reduce = jest.fn(() => "computed");
    addLinks(parents, {
      child: { collection: () => children, field: "childId" },
    });
    addReducers(children, { stamp: { dependency: { _id: 1 }, reduce } });
    const reusable = query(parents, { child: { stamp: 1 } });
    expect((await reusable.fetch())[0].child.stamp).toBe("computed");
    expect(await reusable.fetch()).toEqual([]);
    expect(reduce).toHaveBeenCalledTimes(1);
  });

  it("runs at most eight parent requests and preserves order across completion races", async () => {
    const requests = new Requests();
    const gates = Array.from({ length: 10 }, () => deferred());
    const parents = requests.collection(
      "parents",
      gates.map((_, index) => ({ _id: index, childId: String(index) })),
    );
    const children = requests.collection(
      "children",
      (pipeline) => {
        const id = pipeline[0].$match._id.$in[0];
        return [{ _id: id }];
      },
      (pipeline) => gates[Number(pipeline[0].$match._id.$in[0])],
    );
    addLinks(parents, {
      child: { collection: () => children, field: "childId" },
    });
    const result = query(parents, { child: { $: () => ({}), _id: 1 } }).fetch();
    await requests.waitForStart("children", 8);
    expect(requests.active).toBe(8);
    gates
      .slice(0, 8)
      .reverse()
      .forEach((gate) => gate.resolve());
    await requests.waitForStart("children", 10);
    gates[9].resolve();
    gates[8].resolve();
    expect((await result).map((parent) => parent.child._id)).toEqual(
      gates.map((_, index) => String(index)),
    );
    expect(requests.peak).toBe(8);
  });

  it("stops queued fallback requests when one fails", async () => {
    const requests = new Requests();
    const gate = deferred();
    const parents = requests.collection(
      "parents",
      Array.from({ length: 10 }, (_, index) => ({
        _id: index,
        childId: String(index),
      })),
    );
    const children = requests.collection("children", [], gate);
    addLinks(parents, {
      child: { collection: () => children, field: "childId" },
    });
    const result = query(
      parents,
      { child: { $: () => ({}), _id: 1 } },
      { maxCap: 1 },
    ).fetch();
    const assertion = expect(result).rejects.toThrow("failed");
    await requests.waitForStart("children");
    gate.reject(new Error("failed"));
    await assertion;
    expect(requests.started.filter((name) => name === "children")).toHaveLength(
      1,
    );
  });

  it.each([undefined, 3])(
    "serializes an active transaction despite maxCap %s",
    async (maxCap) => {
      const { requests, gates, root, body, expected } = tree();
      const session = { inTransaction: () => true } as ClientSession;
      const result = query(root, body, { session, maxCap }).fetch();
      gates.root.resolve();
      for (const name of ["a", "b", "c", "next"] as const) {
        await requests.waitForStart(name);
        expect(requests.active).toBe(1);
        gates[name].resolve();
      }
      expect(await result).toEqual(expected);
      expect(requests.peak).toBe(1);
    },
  );
});
