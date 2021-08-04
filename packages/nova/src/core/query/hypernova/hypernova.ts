import prepareForDelivery from "../lib/prepareForDelivery";
import storeHypernovaResults from "./storeHypernovaResults";
import CollectionNode from "../nodes/CollectionNode";
import { performance } from "perf_hooks";

async function hypernovaRecursive(collectionNode: CollectionNode) {
  if (collectionNode.collectionNodes.length === 0) {
    return;
  }

  const collectionNodes = collectionNode.collectionNodes;
  /**
   * The concept here is that hypernova can drill down in parallel. There shouldn't be any reason to block or run queries in-sync
   * The logic here is that the child collections need the parent, but child collection queries can all run in parallel
   * And then when a child collection resolves it also drills down and runs its children (if any) in parallel.
   */
  const promises = [];

  for (const childCollectionNode of collectionNodes) {
    promises.push(
      storeHypernovaResults(childCollectionNode).then(() => {
        return hypernovaRecursive(childCollectionNode);
      })
    );
  }

  await Promise.all(promises);
}

export default async function hypernova(collectionNode: CollectionNode) {
  collectionNode.results = await collectionNode.toArray();

  await hypernovaRecursive(collectionNode);
  await prepareForDelivery(collectionNode);

  return collectionNode.results;
}
