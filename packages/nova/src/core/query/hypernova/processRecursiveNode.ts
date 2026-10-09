import * as _ from "lodash";
import CollectionNode from "../nodes/CollectionNode";
import QueryScheduler from "../QueryScheduler";

/** Resolves parent-dependent queries with bounded fan-out and stable result order. */
export default async function processRecursiveNode(
  node: CollectionNode,
  scheduler?: QueryScheduler,
) {
  const parents = node.parent.results;
  const resultsByParent: any[][] = new Array(parents.length);
  let next = 0;
  let failed = false;

  async function worker() {
    while (!failed && next < parents.length) {
      const index = next++;
      const parent = parents[index];
      try {
        const value = _.get(
          parent,
          node.isVirtual ? node.linkForeignStorageField : node.linkStorageField,
        );
        let results = [];
        if (node.isVirtual || value) {
          const ids = node.isVirtual || !node.linker.isMany() ? [value] : value;
          const field = node.isVirtual
            ? node.linkStorageField
            : node.linkForeignStorageField;
          results = await node.toArray(
            { [field]: { $in: ids } },
            parent,
            scheduler,
          );
        }
        parent[node.name] = results;
        resultsByParent[index] = results;
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  }

  const concurrency = node.session?.inTransaction?.() ? 1 : 8;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, parents.length) }, worker),
  );
  // Separate fetches can return distinct copies of the same _id. Every copy
  // needs its descendants, reducers and projection applied before delivery.
  node.results = resultsByParent.flat();
}
