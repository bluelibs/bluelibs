import * as _ from "lodash";
import * as dot from "dot-object";
import CollectionNode from "../nodes/CollectionNode";
import { LinkStrategy } from "../Linker";

/**
 * Assembles non-virtually linked results
 */
export default function processDirectNode(childCollectionNode: CollectionNode) {
  const parent = childCollectionNode.parent;
  const linker = childCollectionNode.linker;

  const linkStorageField = linker.linkStorageField;
  const linkForeignStorageField = linker.linkForeignStorageField;

  if (childCollectionNode.results.length === 0) {
    const defaultValue = linker.strategy === LinkStrategy.ONE ? null : [];
    parent.results.forEach((parentResult) => {
      parentResult[childCollectionNode.name] = defaultValue;
    });

    return;
  }

  const resultsByKeyId = _.groupBy(childCollectionNode.results, (r) =>
    r[linkForeignStorageField].toString()
  );

  if (linker.strategy === LinkStrategy.ONE) {
    parent.results.forEach((parentResult) => {
      parentResult[childCollectionNode.name] = null;
      const value = _.get(parentResult, linkStorageField);
      if (!value) {
        return;
      }

      parentResult[childCollectionNode.name] = resultsByKeyId[value];
    });
  }

  if (linker.strategy === LinkStrategy.MANY) {
    parent.results.forEach((parentResult) => {
      parentResult[childCollectionNode.name] = [];
      const value = _.get(parentResult, linkStorageField);

      if (!Array.isArray(value)) {
        return;
      }

      const data = [];

      value.forEach((foreignKey) => {
        const result = resultsByKeyId[foreignKey];
        if (result) {
          data.push(_.first(resultsByKeyId[foreignKey]));
        }
      });

      parentResult[childCollectionNode.name] = data;
    });
  }
}
