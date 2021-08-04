import * as _ from "lodash";
import { LinkStrategy } from "../Linker";
import CollectionNode from "../nodes/CollectionNode";

/**
 * Returns the filters that this collection needs to get all results
 * @param childCollectionNode
 */
export function createFilters(childCollectionNode: CollectionNode) {
  const linker = childCollectionNode.linker;
  const isVirtual = linker.isVirtual();
  const linkStorageField = linker.linkStorageField;
  const parentResults = childCollectionNode.parent.results;
  const isMany = childCollectionNode.linker.isMany();

  if (isVirtual) {
    if (isMany) {
      return createManyVirtual(parentResults, linkStorageField);
    } else {
      return createOneVirtual(parentResults, linkStorageField);
    }
  } else {
    if (isMany) {
      return createManyDirect(parentResults, linkStorageField);
    } else {
      return createOneDirect(parentResults, linkStorageField);
    }
  }
}

function uniqIdsComparator(id) {
  return id ? id.toString() : null;
}

function createOneDirect(parentResults: any[], linkStorageField: string) {
  return {
    _id: {
      $in: _.uniqBy(
        _.map(parentResults, (e) => {
          return _.get(e, linkStorageField);
        }).filter((el) => el !== undefined),
        uniqIdsComparator
      ),
    },
  };
}

function createOneVirtual(parentResults: any[], linkStorageField: string) {
  return {
    [linkStorageField]: {
      $in: _.uniqBy(_.map(parentResults, "_id"), uniqIdsComparator),
    },
  };
}

function createManyDirect(parentResults: any[], linkStorageField: string) {
  const arrayOfIds: any[] = _.flatten(
    _.map(parentResults, (e) => _.get(e, linkStorageField))
  ).filter((e) => e !== undefined);

  return {
    _id: {
      $in: _.uniqBy(arrayOfIds, uniqIdsComparator),
    },
  };
}

function createManyVirtual(parentResults: any[], linkStorageField: string) {
  const arrayOfIds = _.flatten(_.map(parentResults, "_id"));
  return {
    [linkStorageField]: {
      $in: _.uniqBy(arrayOfIds, uniqIdsComparator),
    },
  };
}
