import * as MongoDB from "mongodb";
import { IReducerOption } from "@bluelibs/nova";
import { Collection } from "../models/Collection";
import { Constructor } from "@bluelibs/core";

export default async function createCountReducer(
  instance: any,
  options: {
    container: any;
    collection: any;
    relation: string;
    filters?: MongoDB.Filter<any>;
  }
): Promise<IReducerOption> {
  let { collection, relation, container, filters } = options;
  if (!filters) filters = {};

  //method
  let count, query, relationCollection;
  const collectionlink = collection.links[relation];
  if (!collectionlink)
    throw (
      "cant find such a relation " +
      relation +
      " in collection " +
      collection.collectionName
    );
  relationCollection = collectionlink.collection(container);

  if (collectionlink.field) {
    query = {
      ...{
        _id: collectionlink.many
          ? { $in: instance[collectionlink.field] || [] }
          : instance[collectionlink.field],
      },
      ...filters,
    };
  } else if (collectionlink.inversedBy) {
    const inversedLink = relationCollection.links[collectionlink.inversedBy];
    query = {
      ...{
        [inversedLink.field]: inversedLink.many
          ? { $elemMatch: { $eq: instance._id } }
          : instance._id,
      },
      ...filters,
    };
  }
  count = await container.get(relationCollection).count(query);

  return count;
}
