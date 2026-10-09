import * as _ from "lodash";
import CollectionNode from "../nodes/CollectionNode";

export function idsEqual(id1, id2) {
  return id1.toString() === id2.toString();
}

/** Assembles inverse links in child encounter order. */
export default function processVirtualNode(
  childCollectionNode: CollectionNode,
) {
  const parentResults = childCollectionNode.parent.results;
  const linkStorageField = childCollectionNode.linkStorageField;
  const linkForeignStorageField = childCollectionNode.linkForeignStorageField;
  const linkName = childCollectionNode.name;

  if (childCollectionNode.linker.isMany()) {
    const membership = new Map<string, any[]>();
    for (const child of childCollectionNode.results) {
      const stored = _.get(child, linkStorageField);
      if (!stored) continue;
      if (!Array.isArray(stored)) {
        throw new Error(
          `Many link storage "${linkStorageField}" must be an array.`,
        );
      }
      // Repeated memberships must not emit the same child twice for a parent.
      const keys = new Set<string>();
      for (const id of stored) {
        if (id === null || id === undefined) {
          throw new Error(
            `Many link storage "${linkStorageField}" must contain non-null identifiers.`,
          );
        }
        const key = id.toString();
        if (keys.has(key)) continue;
        keys.add(key);
        // The previous find() predicate used the first matching ID's truthiness.
        if (!id) continue;
        const bucket = membership.get(key);
        if (bucket) bucket.push(child);
        else membership.set(key, [child]);
      }
    }
    for (const parent of parentResults) {
      const foreign = _.get(parent, linkForeignStorageField);
      // Each parent owns its array; reducers may mutate it independently.
      parent[linkName] = foreign
        ? (membership.get(foreign.toString()) || []).slice()
        : [];
    }
  } else {
    const group = _.groupBy(childCollectionNode.results, linkStorageField);
    for (const parent of parentResults) {
      parent[linkName] =
        group[_.get(parent, linkForeignStorageField).toString()] || [];
    }
  }
}
