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
  const linkStorageField = childCollectionNode.linkStorageField;
  const linkForeignStorageField = childCollectionNode.linkForeignStorageField;
  const linkName = childCollectionNode.name;
  const isMany = childCollectionNode.linker.isMany();
  const linkStorageFieldDot = linkStorageField.indexOf(".") >= 0;
  const linkForeignStorageFieldDot = linkForeignStorageField.indexOf(".") >= 0;

  const getStorageValue = linkStorageFieldDot
    ? (childResult) => _.get(childResult, linkStorageField)
    : (childResult) => childResult[linkStorageField];

  const getForeignStorageValue = linkForeignStorageFieldDot
    ? (parentResult) => _.get(parentResult, linkForeignStorageField)
    : (parentResult) => parentResult[linkForeignStorageField];

  if (isMany) {
    parentResults.forEach((parentResult) => {
      const foreignStorage = getForeignStorageValue(parentResult);

      parentResult[linkName] = childCollectionNode.results.filter(
        (childResult) => {
          const linkingStorage = getStorageValue(childResult);

          if (linkingStorage && foreignStorage) {
            return linkingStorage.find((l) => idsEqual(l, foreignStorage));
          }
        }
      );
    });
  } else {
    const group = _.groupBy(childCollectionNode.results, linkStorageField);
    parentResults.forEach((parentResult) => {
      parentResult[linkName] =
        group[getForeignStorageValue(parentResult).toString()] || [];
    });
  }
}
