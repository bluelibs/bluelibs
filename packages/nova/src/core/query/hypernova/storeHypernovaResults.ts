import CollectionNode from "../nodes/CollectionNode";
import processDirectNode from "./processDirectNode";
import processRecursiveNode from "./processRecursiveNode";
import processVirtualNode from "./processVirtualNode";
import { createFilters } from "../lib/createFilters";
import * as _ from "lodash";

export default async function storeHypernovaResults(
  childCollectionNode: CollectionNode
) {
  if (childCollectionNode.parent.results.length === 0) {
    // There is no sense in continuing with the graph expansion
    return;
  }

  const linker = childCollectionNode.linker;
  const isVirtual = linker.isVirtual();

  if (shouldProcessRecursively(childCollectionNode)) {
    await processRecursiveNode(childCollectionNode);

    return;
  }

  const hypernovaFilters = createFilters(childCollectionNode);
  childCollectionNode.results = await childCollectionNode.toArray(
    hypernovaFilters
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
    /**
     * In this case we perform a recursive fetch, yes, not very optimal
     */
    if (options.limit !== undefined || options.skip !== undefined) {
      return true;
    }
  }
}
