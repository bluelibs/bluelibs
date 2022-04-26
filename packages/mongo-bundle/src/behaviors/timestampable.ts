import { EventManager } from "@bluelibs/core";
import { ITimestampableBehaviorOptions, BehaviorType } from "../defs";
import { BeforeInsertEvent, BeforeUpdateEvent } from "../events";
import { Collection } from "../models/Collection";

export default function timestampable(
  options: ITimestampableBehaviorOptions = {}
): BehaviorType {
  const fields = options.fields || {
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  };
  const keepInitialUpdateAsNull = options.keepInitialUpdateAsNull || false;

  return (collection: Collection<any>) => {
    collection.localEventManager.addListener(
      BeforeInsertEvent,
      (e: BeforeInsertEvent) => {
        const document = e.data.document;
        const now = new Date();

        Object.assign(document, {
          [fields.createdAt]: document[fields.createdAt] || now,
          [fields.updatedAt]: keepInitialUpdateAsNull
            ? null
            : document[fields.updatedAt] || now,
        });
      }
    );

    collection.localEventManager.addListener(
      BeforeUpdateEvent,
      (e: BeforeUpdateEvent) => {
        const update = e.data.update;

        if (!update.$set) {
          update.$set = {};
        }

        Object.assign(update.$set, {
          [fields.updatedAt]: update.$set[fields.updatedAt] || new Date(),
        });
      }
    );
  };
}
