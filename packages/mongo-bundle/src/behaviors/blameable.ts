import { BeforeInsertEvent, BeforeUpdateEvent } from "../events";
import { IBlameableBehaviorOptions, BehaviorType } from "../defs";
import { Collection } from "../models/Collection";
import { MissingContextForBehaviorException } from "../exceptions";

export default function blameable(
  options: IBlameableBehaviorOptions = {}
): BehaviorType {
  const fields = options.fields || {
    createdBy: "createdById",
    updatedBy: "updatedById",
  };
  const throwErrorWhenMissing = options.throwErrorWhenMissing || false;
  const nullishUpdatedByAtInsert = options.nullishUpdatedByAtInsert || false;

  const userIdFieldInContext = "userId";

  const extractUserID = (context) => {
    if (!context) {
      return null;
    }

    return context[userIdFieldInContext];
  };

  const checkUserId = (userId: any, collection: Collection<any>) => {
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
        const { context } = e.data;

        const userId = extractUserID(context);

        checkUserId(userId, collection);

        if (userId === undefined) return;

        const document = e.data.document;

        Object.assign(document, {
          [fields.createdBy]: userId,
          [fields.updatedBy]: nullishUpdatedByAtInsert ? null : userId,
        });
      }
    );

    collection.localEventManager.addListener(
      BeforeUpdateEvent,
      (e: BeforeUpdateEvent) => {
        const { context } = e.data;

        const userId = extractUserID(context);

        checkUserId(userId, collection);

        if (userId === undefined) return;

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
