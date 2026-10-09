import CollectionNode from "../nodes/CollectionNode";
import QueryScheduler from "../QueryScheduler";
import processDirectNode from "./processDirectNode";
import processPaginatedNode from "./processPaginatedNode";
import processRecursiveNode from "./processRecursiveNode";
import processVirtualNode from "./processVirtualNode";
import { createFilters } from "../lib/createFilters";
import * as _ from "lodash";

export default async function storeHypernovaResults(
  childCollectionNode: CollectionNode,
  scheduler?: QueryScheduler,
) {
  if (childCollectionNode.parent.results.length === 0) {
    // A reused query must not retain results from its previous execution.
    childCollectionNode.results = [];
    return;
  }

  const linker = childCollectionNode.linker;
  const isVirtual = linker.isVirtual();

  if (shouldProcessRecursively(childCollectionNode)) {
    if (!(await processPaginatedNode(childCollectionNode, scheduler))) {
      await processRecursiveNode(childCollectionNode, scheduler);
    }

    return;
  }

  const hypernovaFilters = createFilters(childCollectionNode);
  childCollectionNode.results = await childCollectionNode.toArray(
    hypernovaFilters,
    undefined,
    scheduler,
  );
  // if it's not virtual then we retrieve them and assemble them here.
  if (!isVirtual) {
    processDirectNode(childCollectionNode);
  } else {
    processVirtualNode(childCollectionNode);
  }
}

export function shouldProcessRecursively(childCollectionNode: CollectionNode) {
  if (_.isFunction(childCollectionNode.props)) {
    return true;
  }

  const { filters, options } = childCollectionNode.getPropsForQuerying();

  // When we have a many relationship with limit/skip
  if (!childCollectionNode.isOneResult) {
    if (options.limit !== undefined || options.skip !== undefined) {
      return true;
    }
  }
}
