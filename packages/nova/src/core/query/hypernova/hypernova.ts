import prepareForDelivery from "../lib/prepareForDelivery";
import storeHypernovaResults from "./storeHypernovaResults";
import CollectionNode from "../nodes/CollectionNode";
import QueryScheduler from "../QueryScheduler";

async function hypernovaRecursive(
  collectionNode: CollectionNode,
  scheduler?: QueryScheduler
) {
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
      storeHypernovaResults(childCollectionNode, scheduler).then(() => {
        return hypernovaRecursive(childCollectionNode, scheduler);
      })
    );
  }

  await Promise.all(promises);
}

export default async function hypernova(collectionNode: CollectionNode) {
  // Each execution owns its queue; separate queries and later retries stay independent.
  const maxCap = collectionNode.context.maxCap;
  const scheduler = maxCap === undefined ? undefined : new QueryScheduler(maxCap);
  collectionNode.results = await collectionNode.toArray({}, undefined, scheduler);

  await hypernovaRecursive(collectionNode, scheduler);
  await prepareForDelivery(collectionNode);

  return collectionNode.results;
}
