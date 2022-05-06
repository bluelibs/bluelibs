import * as MongoDB from "mongodb";
import { IReducerOption } from "@bluelibs/nova";
import { Collection } from "../models/Collection";

export default async function createCountReducer(
  instance: any,
  options: {
    context: any;
    collection: any;
    relation: string;
    filters?: MongoDB.Filter<any>;
  }
): IReducerOption {
  let { collection, relation, context, filters } = options;
  if (!filters) filters = {};
  const container = context.container;

  //method
  let count, query, relationCollection;
  const collectionlink = collection.links[relation];
  if (!collectionlink)
    throw "cant find such a relation ${relation} in collection ${collection.collectionName}";
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
