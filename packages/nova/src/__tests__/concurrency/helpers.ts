import { Collection, Document } from "mongodb";
import { cloneDeep } from "lodash";
import { addLinks } from "../../core/api";

export function deferred() {
  let resolve: () => void;
  let reject: (error: unknown) => void;
  const promise = new Promise<void>((ok, fail) => {
    resolve = ok;
    reject = fail;
  });
  return { promise, resolve, reject };
}

export class Requests {
  public active = 0;
  public peak = 0;
  public started: string[] = [];
  public finished: string[] = [];
  private listeners: Array<() => void> = [];

  public collection(
    name: string,
    documents: Document[] | ((pipeline: Document[]) => Document[]),
    gate?: ReturnType<typeof deferred>,
  ): Collection {
    return {
      collectionName: name,
      createIndex: jest.fn().mockResolvedValue("linkIndex"),
      aggregate: jest.fn((pipeline, _options) => {
        this.active++;
        this.peak = Math.max(this.peak, this.active);
        this.started.push(name);
        this.notify();
        return {
          toArray: async () => {
            try {
              if (gate) {
                await gate.promise;
              }
              return cloneDeep(
                typeof documents === "function"
                  ? documents(pipeline)
                  : documents,
              );
            } finally {
              this.active--;
              this.finished.push(name);
              this.notify();
            }
          },
        };
      }),
    } as unknown as Collection;
  }

  public waitForStart(name: string, count = 1) {
    return this.waitFor(
      () => this.started.filter((item) => item === name).length >= count,
    );
  }

  public waitForFinish(name: string) {
    return this.waitFor(() => this.finished.includes(name));
  }

  private waitFor(condition: () => boolean): Promise<void> {
    if (condition()) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const listener = () => {
        if (condition()) {
          this.listeners = this.listeners.filter((item) => item !== listener);
          resolve();
        }
      };
      this.listeners.push(listener);
    });
  }

  private notify() {
    [...this.listeners].forEach((listener) => listener());
  }
}

export function tree() {
  const requests = new Requests();
  const gates = {
    root: deferred(),
    a: deferred(),
    b: deferred(),
    c: deferred(),
    next: deferred(),
  };
  const root = requests.collection(
    "root",
    [{ _id: "root", aId: "a", bId: "b", cId: "c" }],
    gates.root,
  );
  const a = requests.collection(
    "a",
    [{ _id: "a", name: "A", nextId: "next" }],
    gates.a,
  );
  const b = requests.collection("b", [{ _id: "b", name: "B" }], gates.b);
  const c = requests.collection("c", [{ _id: "c", name: "C" }], gates.c);
  const next = requests.collection(
    "next",
    [{ _id: "next", name: "Next" }],
    gates.next,
  );
  addLinks(root, {
    a: { collection: () => a, field: "aId" },
    b: { collection: () => b, field: "bId" },
    c: { collection: () => c, field: "cId" },
  });
  addLinks(a, { next: { collection: () => next, field: "nextId" } });
  const body = {
    _id: 1,
    a: { name: 1, next: { name: 1 } },
    b: { name: 1 },
    c: { name: 1 },
  };
  const expected = [
    {
      _id: "root",
      a: { _id: "a", name: "A", next: { _id: "next", name: "Next" } },
      b: { _id: "b", name: "B" },
      c: { _id: "c", name: "C" },
    },
  ];
  return { requests, gates, root, body, expected };
}
