import { ObjectId } from "mongodb";
import CollectionNode from "../../core/query/nodes/CollectionNode";
import processVirtualNode from "../../core/query/hypernova/processVirtualNode";

function assemble(parents, children) {
  processVirtualNode({
    parent: { results: parents },
    results: children,
    name: "children",
    linkStorageField: "links.ids",
    linkForeignStorageField: "profile.key",
    linker: { isMany: () => true },
  } as unknown as CollectionNode);
}

describe("Inverse many-to-many assembly", () => {
  it("retains dotted paths, encounter order and one child per membership", () => {
    const id = new ObjectId();
    const parents = [
      { profile: { key: id } },
      { profile: { key: id.toHexString() } },
      { profile: { key: "missing" } },
      { profile: {} },
    ] as any[];
    const children = [
      { name: "first", links: { ids: [id, id.toHexString(), id] } },
      { name: "empty", links: { ids: [] } },
      { name: "absent" },
      { name: "second", links: { ids: [id] } },
    ];
    assemble(parents, children);
    expect(
      parents.map((parent) => parent.children.map((child) => child.name)),
    ).toEqual([["first", "second"], ["first", "second"], [], []]);
    expect(parents[0].children[0]).toBe(children[0]);
    parents[0].children.pop();
    expect(parents[1].children).toHaveLength(2);
  });

  it("normalizes each membership once rather than scanning children per parent", () => {
    const stringify = jest.fn(() => "same");
    const parents = Array.from({ length: 100 }, () => ({
      profile: { key: "same" },
    }));
    const children = Array.from({ length: 200 }, () => ({
      links: { ids: [{ toString: stringify }] },
    }));
    assemble(parents, children);
    expect(stringify).toHaveBeenCalledTimes(200);
    expect((parents[99] as any).children).toHaveLength(200);
  });

  it("preserves first-match truthiness for mixed numeric/string identifiers", () => {
    const parents = [
      { profile: { key: "0" } },
      { profile: { key: 0 } },
    ] as any[];
    assemble(parents, [
      { name: "numeric first", links: { ids: [0, "0"] } },
      { name: "string first", links: { ids: ["0", 0] } },
    ]);
    expect(parents[0].children.map((child) => child.name)).toEqual([
      "string first",
    ]);
    expect(parents[1].children).toEqual([]);
  });

  it("rejects null identifiers in a stored membership array", () => {
    expect(() =>
      assemble([{ profile: { key: "a" } }], [{ links: { ids: [null] } }]),
    ).toThrow("must contain non-null identifiers");
  });

  it("rejects non-array many-link storage", () => {
    expect(() =>
      assemble([{ profile: { key: "a" } }], [{ links: { ids: "a" } }]),
    ).toThrow('Many link storage "links.ids" must be an array.');
  });
});
