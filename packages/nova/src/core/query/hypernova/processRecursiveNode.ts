import * as _ from "lodash";
import CollectionNode from "../nodes/CollectionNode";

/**
 * This function is called only when the child collection can only be resolved by recursive fetch
 * So instead of getting all results via hypernova, we get them recursively
 *
 * @param childCollectionNode
 */
export default async function processRecursiveNode(
  childCollectionNode: CollectionNode
) {
  const parentResults = childCollectionNode.parent.results;
  const allResults = [];
  const linkStorageField = childCollectionNode.linkStorageField;
  const linkName = childCollectionNode.name;
  const isMany = childCollectionNode.linker.isMany();

  if (childCollectionNode.isVirtual) {
    // Then it's either 1:M either M:M
    // Lucky for us $in works with both arrays and strings, so there's no distinction in the filter
    for (const parentResult of parentResults) {
      const results = await childCollectionNode.toArray(
        {
          [linkStorageField]: { $in: [parentResult._id] }
        },
        parentResult
      );

      parentResult[linkName] = results;
      allResults.push(...results);
    }
  } else {
    for (const parentResult of parentResults) {
      if (!parentResult[linkStorageField]) {
        parentResult[linkStorageField] = [];
        continue;
      }

      const $in = isMany
        ? parentResult[linkStorageField]
        : [parentResult[linkStorageField]];

      const results = await childCollectionNode.toArray(
        {
          _id: { $in }
        },
        parentResult
      );

      allResults.push(...results);
      parentResult[linkName] = results;
    }
  }

  childCollectionNode.results = _.uniqBy(allResults, id => id.toString());
}
