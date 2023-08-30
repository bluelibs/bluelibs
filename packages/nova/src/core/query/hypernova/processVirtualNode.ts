import * as _ from "lodash";
import CollectionNode from "../nodes/CollectionNode";

export function idsEqual(id1, id2) {
  return id1.toString() === id2.toString();
}

/**
 *
 * @param childCollectionNode
 */
export default function processVirtualNode(
  childCollectionNode: CollectionNode
) {
  const parentResults = childCollectionNode.parent.results;
  const linkStorageField = childCollectionNode.linkForeignStorageField;
  const linkForeignStorageField = childCollectionNode.linkForeignStorageField;
  const linkName = childCollectionNode.name;
  const isMany = childCollectionNode.linker.isMany();
  const linkStorageFieldDot = linkStorageField.indexOf(".") >= 0;

  const getStorageValue = linkStorageFieldDot
    ? (childResult) => _.get(childResult, linkStorageField)
    : (childResult) => childResult[linkStorageField];

  if (isMany) {
    parentResults.forEach((parentResult) => {
      parentResult[linkName] = childCollectionNode.results.filter(
        (childResult) => {
          const linkingStorage = getStorageValue(childResult);
          if (linkingStorage) {
            return linkingStorage.find((l) =>
              idsEqual(l, parentResult[linkForeignStorageField])
            );
          }
        }
      );
    });
  } else {
    const group = _.groupBy(childCollectionNode.results, linkStorageField);
    parentResults.forEach((parentResult) => {
      parentResult[linkName] =
        group[parentResult[linkForeignStorageField].toString()] || [];
    });
  }
}
