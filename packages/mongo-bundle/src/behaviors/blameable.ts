import { BeforeInsertEvent, BeforeUpdateEvent } from "../events";
import { IBlameableBehaviorOptions, BehaviorType } from "../defs";
import { Collection } from "../models/Collection";
import { MissingContextForBehaviorException } from "../exceptions";

export default function blameable(
  options: IBlameableBehaviorOptions = {}
): BehaviorType {
  const fields = options.fields || {
    createdBy: "createdBy",
    updatedBy: "updatedBy",
  };
  const throwErrorWhenMissing = options.throwErrorWhenMissing || false;

  const userIdFieldInContext = "userId";

  const extractUserID = (context) => {
    if (!context) {
      return null;
    }

    return context[userIdFieldInContext];
  };

  const checkUserId = (userId, collection: Collection<any>) => {
    if (userId === undefined && throwErrorWhenMissing) {
      throw new Error(
        `You have to provide { userId } inside the context when you perform this insert mutation on ${collection.collectionName} collection.`
      );
    }
  };

  return (collection: Collection<any>) => {
    collection.localEventManager.addListener(
      BeforeInsertEvent,
      (e: BeforeInsertEvent) => {
        const userId = extractUserID(e.data.context);
        checkUserId(userId, collection);

        const document = e.data.document;

        Object.assign(document, {
          [fields.createdBy]: userId,
          [fields.updatedBy]: userId,
        });
      }
    );

    collection.localEventManager.addListener(
      BeforeUpdateEvent,
      (e: BeforeUpdateEvent) => {
        const userId = extractUserID(e.data.context);
        checkUserId(userId, collection);

        const update = e.data.update;

        if (!update.$set) {
          update.$set = {};
        }

        Object.assign(update.$set, {
          [fields.updatedBy]: userId,
        });
      }
    );
  };
}
