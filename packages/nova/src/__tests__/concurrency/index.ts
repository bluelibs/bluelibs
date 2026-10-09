import { ClientSession } from "mongodb";
import gql from "graphql-tag";
import { astQueryToInfo } from "../../core/graphql/astToQuery";
import { query, decorate } from "../../core/api";
import { Requests, deferred, tree } from "./helpers";
import CollectionNode from "../../core/query/nodes/CollectionNode";
import "./recursive";
import "./failures";

describe("Query request concurrency", () => {
  it.each([undefined, 3])(
    "unblocks descendants while siblings are active (maxCap: %s)",
    async (maxCap) => {
      const { requests, gates, root, body, expected } = tree();
      const result = query(root, body, { maxCap }).fetch();
      expect(requests.started).toEqual(["root"]);
      gates.root.resolve();
      await Promise.all(
        ["a", "b", "c"].map((name) => requests.waitForStart(name)),
      );
      expect(requests.active).toBe(3);
      gates.a.resolve();
      await requests.waitForStart("next");
      expect(requests.finished).not.toContain("b");
      expect(requests.finished).not.toContain("c");
      expect(requests.active).toBe(3);
      gates.next.resolve();
      gates.b.resolve();
      gates.c.resolve();
      expect(await result).toEqual(expected);
      expect(requests.peak).toBe(3);
      expect(requests.active).toBe(0);
    },
  );

  it("shares a cap across siblings and descendants with FIFO admission", async () => {
    const { requests, gates, root, body, expected } = tree();
    const result = query(root, body, { maxCap: 2 }).fetch();
    gates.root.resolve();
    await requests.waitForStart("b");
    expect(requests.started).toEqual(["root", "a", "b"]);
    gates.a.resolve();
    await requests.waitForStart("c");
    expect(requests.started).not.toContain("next");
    gates.c.resolve();
    await requests.waitForStart("next");
    expect(requests.finished).not.toContain("b");
    expect(requests.active).toBe(2);
    gates.next.resolve();
    gates.b.resolve();
    expect(await result).toEqual(expected);
    expect(requests.started).toEqual(["root", "a", "b", "c", "next"]);
    expect(requests.peak).toBe(2);
  });

  it("serializes requests at maxCap 1 without holding a slot for descendants", async () => {
    const { requests, gates, root, body, expected } = tree();
    const result = query(root, { ...body, $context: { maxCap: 1 } }).fetch();
    gates.root.resolve();
    for (const name of ["a", "b", "c", "next"] as const) {
      await requests.waitForStart(name);
      expect(requests.active).toBe(1);
      gates[name].resolve();
    }
    expect(await result).toEqual(expected);
    expect(requests.peak).toBe(1);
  });

  it("retains the cap through an existing two-argument read wrapper", async () => {
    const { requests, gates, root, body, expected } = tree();
    const prototype = CollectionNode.prototype;
    const toArray = prototype.toArray;
    // Existing empty-link adapters forward the original two arguments only.
    prototype.toArray = function (filters, parent) {
      return toArray.call(this, filters, parent);
    };
    const result = query(root, body, { maxCap: 1 }).fetch();
    try {
      gates.root.resolve();
      for (const name of ["a", "b", "c", "next"] as const) {
        await requests.waitForStart(name);
        expect(requests.active).toBe(1);
        gates[name].resolve();
      }
      expect(await result).toEqual(expected);
      expect(requests.peak).toBe(1);
    } finally {
      Object.values(gates).forEach((gate) => gate.resolve());
      await result;
      prototype.toArray = toArray;
    }
  });

  it("keeps queues independent even when queries share their context", async () => {
    const requests = new Requests();
    const gate = deferred();
    const root = requests.collection("root", [{ _id: "root" }], gate);
    const context = { maxCap: 1 };
    const results = [
      query(root, { _id: 1 }, context).fetch(),
      query(root, { _id: 1 }, context).fetch(),
    ];
    await requests.waitForStart("root", 2);
    expect(requests.active).toBe(2);
    gate.resolve();
    expect(await Promise.all(results)).toEqual([
      [{ _id: "root" }],
      [{ _id: "root" }],
    ]);
  });

  it("keeps the root cap when nested contexts request a different cap", async () => {
    const { requests, gates, root, body, expected } = tree();
    const result = query(
      root,
      {
        ...body,
        $context: { maxCap: 3 },
        a: { ...body.a, $context: { maxCap: 100 } },
      },
      { maxCap: 2 },
    ).fetch();
    gates.root.resolve();
    await requests.waitForStart("b");
    expect(requests.started).not.toContain("c");
    gates.a.resolve();
    await requests.waitForStart("c");
    gates.c.resolve();
    await requests.waitForStart("next");
    expect(requests.active).toBe(2);
    gates.b.resolve();
    gates.next.resolve();
    expect(await result).toEqual(expected);
    expect(requests.peak).toBe(2);
  });

  it.each(["decorated", "secure", "graphql"])(
    "uses the cap through the %s query API",
    async (api) => {
      const { requests, gates, root, body, expected } = tree();
      const context = { maxCap: 1, session: {} as ClientSession };
      const createQuery = {
        decorated: () => decorate<null, any>(root).query(body, context),
        secure: () => query.securely({}, root, body, context),
        graphql: () =>
          query.graphql(
            root,
            astQueryToInfo(gql`
              {
                root {
                  _id
                  a {
                    name
                    next {
                      name
                    }
                  }
                  b {
                    name
                  }
                  c {
                    name
                  }
                }
              }
            `),
            {},
            context,
          ),
      };
      const novaQuery = createQuery[api]();
      const result = novaQuery.fetchOne();
      gates.root.resolve();
      const names = ["a", "b", "c", "next"];
      for (const name of names) {
        await requests.waitForStart(name);
        gates[name].resolve();
      }
      expect(await result).toEqual(expected[0]);
      expect(requests.peak).toBe(1);
      const options = (root.aggregate as jest.Mock).mock.calls[0][1];
      expect(options.session).toBe(context.session);
      expect(options).not.toHaveProperty("maxCap");
    },
  );

  it("does not fetch descendants when the root is empty", async () => {
    const { requests, root, body } = tree();
    (root.aggregate as jest.Mock).mockReturnValueOnce({
      toArray: async () => [],
    });
    const result = await query(root, body, { maxCap: 1 }).toArray();
    expect(result).toEqual([]);
    expect(root.aggregate).toHaveBeenCalledTimes(1);
    expect(requests.started).toEqual([]);
  });
});
