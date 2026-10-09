import { query } from "../../core/api";
import { Requests, tree } from "./helpers";

describe("Query concurrency failures", () => {
  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, null, "2"])(
    "rejects invalid maxCap %s before any request starts",
    async (maxCap) => {
      const requests = new Requests();
      const root = requests.collection("root", []);
      await expect(
        query(root, {}, { maxCap: maxCap as number }).fetch(),
      ).rejects.toThrow("Query maxCap must be a positive safe integer.");
      expect(root.aggregate).not.toHaveBeenCalled();
    },
  );

  it("rejects queued work and prevents later descendants after a request fails", async () => {
    const { requests, gates, root, body } = tree();
    const error = new Error("cursor failed");
    const result = query(root, body, { maxCap: 2 }).fetch();
    const rejection = expect(result).rejects.toBe(error);
    gates.root.resolve();
    await requests.waitForStart("b");
    gates.b.reject(error);
    await rejection;
    expect(requests.started).toEqual(["root", "a", "b"]);
    gates.a.resolve();
    await requests.waitForFinish("a");
    // Let the already-running branch attempt to expand after the rejected query.
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(requests.started).toEqual(["root", "a", "b"]);
    expect(requests.active).toBe(0);
  });

  it.each(["aggregate", "cursor"])(
    "can execute the same query again after a synchronous %s failure",
    async (failure) => {
      const requests = new Requests();
      const root = requests.collection("root", [{ _id: "root" }]);
      const error = new Error("request failed");
      (root.aggregate as jest.Mock).mockImplementationOnce(() => {
        if (failure === "aggregate") {
          throw error;
        }
        return {
          toArray: () => {
            throw error;
          },
        };
      });
      const novaQuery = query(root, { _id: 1 }, { maxCap: 1 });
      await expect(novaQuery.fetch()).rejects.toBe(error);
      expect(await novaQuery.fetch()).toEqual([{ _id: "root" }]);
      expect(requests.active).toBe(0);
    },
  );
});
