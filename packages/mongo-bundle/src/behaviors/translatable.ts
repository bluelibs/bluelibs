import { EventManager } from "@bluelibs/core";
import { addLinks } from "@bluelibs/nova";
import {
  ITimestampableBehaviorOptions,
  BehaviorType,
  ITranslatableBehaviorOptions,
} from "../defs";
import { Collection } from "../models/Collection";

export default function translatable(
  options: ITranslatableBehaviorOptions
): BehaviorType {
  return (collection: Collection<any>) => {
    const i18nCollection = collection.getCollection(options.collection);
    addLinks(collection.collection, {
      i18ns: {
        inversedBy: "reference",
        collection: () => i18nCollection.collection,
      },
    });
    addLinks(i18nCollection.collection, {
      reference: {
        field: "referenceId",
        collection: () => collection.collection,
      },
    });
  };
}
